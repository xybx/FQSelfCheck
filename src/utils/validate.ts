export const isLonLat = (lon: any, lat: any) => {
    if (!lon || !lat) return false
    lon = Number(lon)
    lat = Number(lat)
    let lonReg = /^(\-|\+)?(((\d|[1-9]\d|1[0-7]\d|0{1,3})\.\d{0,15})|(\d|[1-9]\d|1[0-7]\d|0{1,3})|180\.0{0,15}|180)$/
    let latReg = /^(\-|\+)?([0-8]?\d{1}\.\d{0,15}|90\.0{0,15}|[0-8]?\d{1}|90)$/
    if (lonReg.test(lon) && latReg.test(lat)) {
        return [lon, lat]
    } else {
        return false
    }
}

export const isNumber = (num: any, defaultNum: number = 100) => {
    num = Number(num)
    if (isNaN(num)) {
        num = defaultNum
    }
    return num
}