type QueryDate = {
    search:string, start:string, end:string
}
export const QueryStringToObject = ( queryDate:string ):QueryDate => {
    const split = queryDate.split(":");
    const search = split[0].trim();
    const dates = split[1].slice(1, -1).split("}-{");
    const start = dates[0].trim();
    const end = dates[1].trim();
    return { search, start, end };
}