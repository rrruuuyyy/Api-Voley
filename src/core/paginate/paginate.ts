import { Brackets, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { startOfDay, endOfDay } from 'date-fns';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PageMetaDto } from './meta.dto';
import { PageOptionsDto, Order } from '../interfaces/pageOptions.dto';
import { PageDto } from './page.dto';
import { QueryStringToObject } from './utils';

/**
 * Interfaz que define las opciones de paginación y configuración de comportamiento
 */
interface PaginationOptions {
  /** Lista de claves permitidas para filtrado. Si es null, se permiten todas las claves */
  allowedKeys?: string[] | null;
  /** Retornar datos antes de aplicar los límites de paginación */
  getBeforePaginate?: boolean;
  /** Forzar modo de consulta raw */
  isRaw?: boolean;
  /** Incluir registros eliminados lógicamente */
  withDeleted?: boolean;
}

/**
 * Interfaz para la estructura de filtros
 */
interface Filter {
  key: string;
  value: string;
}

/**
 * Función de paginación mejorada con manejo avanzado de errores y organización de código
 * @param query - Instancia de SelectQueryBuilder de TypeORM
 * @param pageOptionsDto - Opciones de paginación y filtrado
 * @param options - Configuración adicional de paginación
 * @returns Resultado paginado o datos raw según la configuración
 */
export const paginate = async <T extends ObjectLiteral = any>(
  query: SelectQueryBuilder<T>,
  pageOptionsDto: PageOptionsDto,
  options: PaginationOptions = {}
): Promise<PageDto<T> | T[]> => {
  try {
    const {
      allowedKeys = null,
      getBeforePaginate = false,
      isRaw = false,
      withDeleted = false
    } = options;

    // Aplicar manejo de eliminación lógica
    if (withDeleted || pageOptionsDto.whitDeleted) {
      query.withDeleted();
    }

    // Aplicar filtros personalizados con validación de seguridad
    await applyCustomFilters(query, pageOptionsDto.queryAnd, allowedKeys);

    // Aplicar filtros basados en campos
    applyFieldFilters(query, pageOptionsDto.fields, pageOptionsDto.filter);

    // Aplicar filtros de rango de fechas
    applyDateFilters(query, pageOptionsDto.queryDate);

    // Aplicar ordenamiento
    applySorting(query, pageOptionsDto.order, pageOptionsDto.orderBy);

    // Ejecutar consulta para obtener el conteo total
    const queryResult = await query.getRawAndEntities();
    const itemCount = calculateItemCount(queryResult);
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    // Retornar datos basados en la configuración
    return await executeQuery(
      query,
      pageOptionsDto,
      pageMetaDto,
      queryResult,
      { getBeforePaginate, isRaw }
    );

  } catch (error) {
    handlePaginationError(error);
  }
};

/**
 * Aplicar filtros personalizados con validación opcional de claves
 */
async function applyCustomFilters(
  query: SelectQueryBuilder<any>,
  queryAnd: string | undefined,
  allowedKeys: string[] | null
): Promise<void> {
  if (!queryAnd) return;

  const filters = parseFilters(queryAnd, allowedKeys);
  
  for (const filter of filters) {
    query.andWhere(`LOWER(${filter.key}) LIKE LOWER(:${filter.key})`, {
      [filter.key]: `%${filter.value}%`,
    });
  }
}

/**
 * Analizar y validar filtros desde la cadena de consulta
 */
function parseFilters(queryAnd: string, allowedKeys: string[] | null): Filter[] {
  return queryAnd
    .split(',')
    .map(pair => {
      const [key, value] = pair.split(':');
      if (!key || !value) return null;
      
      // Validar contra claves permitidas si se proporcionan
      if (allowedKeys && !allowedKeys.includes(key)) {
        return null;
      }
      
      return { key: key.trim(), value: value.trim() };
    })
    .filter((filter): filter is Filter => filter !== null);
}

/**
 * Aplicar filtros de búsqueda basados en campos
 */
function applyFieldFilters(
  query: SelectQueryBuilder<any>,
  fields: string | undefined,
  filter: string | undefined
): void {
  if (!fields || !filter) return;

  const fieldArray = fields.split(',').map(field => field.trim());
  query.andWhere(
    new Brackets(qb => {
      for (const field of fieldArray) {
        qb.orWhere(`LOWER(${field}) LIKE LOWER(:filterValue)`, { 
          filterValue: `%${filter}%` 
        });
      }
    })
  );
}

/**
 * Aplicar filtros de rango de fechas
 */
function applyDateFilters(
  query: SelectQueryBuilder<any>,
  queryDate: string | undefined
): void {
  if (!queryDate) return;

  const { search, start, end } = QueryStringToObject(queryDate);
  
  query.andWhere(`${search} BETWEEN :startDate AND :endDate`, {
    startDate: startOfDay(new Date(start)),
    endDate: endOfDay(new Date(end))
  });
}

/**
 * Aplicar ordenamiento a la consulta
 */
function applySorting(
  query: SelectQueryBuilder<any>,
  order: Order | undefined,
  orderBy: string | undefined
): void {
  if (order && orderBy) {
    query.orderBy(orderBy, order);
  }
}

/**
 * Calcular el conteo total de elementos del resultado de la consulta
 */
function calculateItemCount(queryResult: { entities: any[]; raw: any[] }): number {
  return queryResult.entities.length || queryResult.raw.length;
}

/**
 * Ejecutar consulta final con paginación
 */
async function executeQuery<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  pageOptionsDto: PageOptionsDto,
  pageMetaDto: PageMetaDto,
  queryResult: { entities: T[]; raw: any[] },
  options: { getBeforePaginate: boolean; isRaw: boolean }
): Promise<PageDto<T> | T[]> {
  const { getBeforePaginate, isRaw } = options;
  const hasEntities = queryResult.entities.length > 0;

  if (hasEntities && !isRaw) {
    return await handleEntityQuery(query, pageOptionsDto, pageMetaDto, getBeforePaginate);
  } else {
    return await handleRawQuery(query, pageOptionsDto, pageMetaDto, getBeforePaginate);
  }
}

/**
 * Manejar consultas basadas en entidades
 */
async function handleEntityQuery<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  pageOptionsDto: PageOptionsDto,
  pageMetaDto: PageMetaDto,
  getBeforePaginate: boolean
): Promise<PageDto<T> | T[]> {
  if (getBeforePaginate) {
    const { entities } = await query.getRawAndEntities();
    return entities;
  }

  query.skip(pageOptionsDto.skip).take(pageOptionsDto.limit);
  const { entities } = await query.getRawAndEntities();
  return new PageDto(entities, pageMetaDto);
}

/**
 * Manejar consultas raw
 */
async function handleRawQuery<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  pageOptionsDto: PageOptionsDto,
  pageMetaDto: PageMetaDto,
  getBeforePaginate: boolean
): Promise<PageDto<T> | T[]> {
  if (getBeforePaginate) {
    return await query.getRawMany();
  }

  query.limit(pageOptionsDto.limit).offset(pageOptionsDto.skip);
  const data = await query.getRawMany();
  return new PageDto(data, pageMetaDto);
}

/**
 * Manejar errores de paginación con logging apropiado y mensajes amigables para el usuario
 */
function handlePaginationError(error: any): never {
  console.error('Error de paginación:', error);
  
  // Proporcionar mensajes de error más específicos basados en el tipo de error
  if (error instanceof TypeError) {
    throw new HttpException(
      'Parámetros de paginación inválidos proporcionados',
      HttpStatus.BAD_REQUEST
    );
  }
  
  if (error instanceof SyntaxError) {
    throw new HttpException(
      'Formato de filtro inválido proporcionado',
      HttpStatus.BAD_REQUEST
    );
  }
  
  throw new HttpException(
    'Ocurrió un error durante el procesamiento de la paginación',
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}