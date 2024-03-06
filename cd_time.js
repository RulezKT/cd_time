const { JD2000, SEC_IN_1_DAY } = require("cd_consts");

/*****************************************************************************
 long long int gregdate_to_sec_from_j2000(int year, int month, int day,
 int hour, int minutes, int seconds)
 ******************************************************************************
 This subroutine takes gregorian date and converts it
 to seconds past from JD2000(2451545.0)

 Calling sequence parameters:
 int year, int month, int day, int hour, int minutes, int seconds
 = gregorian (civil) data.

 returns: seconds from JD2000

 This function has no dependencies.

 algorithm:
 https://ru.wikipedia.org/wiki/%D0%AE%D0%BB%D0%B8%D0%B0%D0%BD%D1%81%D0%BA%D0%B0%D1%8F_%D0%B4%D0%B0%D1%82%D0%B0
 *****************************************************************************/
function gregdate_to_sec_from_j2000(year, month, day, hour, minutes, seconds) {
  //console.log(year, month, day, hour, minutes, seconds);

  //Math.trunc = Math.floor;
  //One must compute first the number of years (y) and months (m) since March 1 −4800 (March 1, 4801 BC)
  let a = Math.trunc((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  //All years in the BC era must be converted to astronomical years,
  //so that 1 BC is year 0, 2 BC is year −1, etc. Convert to a negative number, then increment toward zero.
  //JDN — это номер юлианского дня (англ. Julian Day Number),
  //который начинается в полдень числа, для которого производятся вычисления.
  //Then, if starting from a Gregorian calendar date compute:
  let jdn =
    day +
    Math.trunc((153 * m + 2) / 5) +
    365 * y +
    Math.trunc(y / 4) -
    Math.trunc(y / 100) +
    Math.trunc(y / 400) -
    32045;

  // теперь отталкиваясь от полдня корректируемся на часы минуты и секунды
  // если время после 12, вычитаем половину суток из JDN и из времени в секундах
  // так как время нового дня переданное функции отталкивается от 00:00
  // а Юлианские дни от 12:00
  if (hour < 12) {
    jdn -= 0.5;
    //date_in_sec -= 43200;
  } else {
    hour -= 12;
  }

  jdn += (hour * 60 * 60 + minutes * 60 + seconds) / 86400.0;
  //console.log(`\nfrom greg_to_sec Julian Day = ${jdn}`);

  // переводим в секунды от JD200 часы минуты и секунды пока не учтены
  //let date_in_sec = (jdn - JD2000) * 86400;
  //date_in_sec += hour * 60 * 60 + minutes * 60 + seconds;
  date_in_sec = (jdn - JD2000) * 86400;
  //printf("from greg_to_secdate in seconds = %f\n", date_in_sec);
  //printf("\n");

  return date_in_sec;
}

function sec_from_jd2000_to_gregdate(sec_from_jd2000) {
  //получаем Julian Day
  let jdn = JD2000 + sec_from_jd2000 / SEC_IN_1_DAY;

  //calculating necessary coeffs
  const a = jdn + 32044;
  const b = Math.trunc((4 * a + 3) / 146097);
  const c = a - Math.trunc((146097 * b) / 4);
  const d = Math.trunc((4 * c + 3) / 1461);
  const e = c - Math.trunc((1461 * d) / 4);
  const m = Math.trunc((5 * e + 2) / 153);

  let month = m + 3 - 12 * Math.trunc(m / 10);
  let year = 100 * b + d - 4800 + Math.trunc(m / 10);

  //Дальше коэффициенты подбирал вручную, так как алгоритма дальше дня не нашел
  //в конце добавляем 0.5 так начало JD считается на 12:00 а нам надо на 00:00
  let day = Math.trunc(e - Math.trunc((153 * m + 2) / 5) + 1 + 0.5);
  let hour = Math.trunc(
    24 * (e - Math.trunc((153 * m + 2) / 5) + 1 + 0.5 - day)
  );
  //в конце вычитаем  0.808, нашел подгоном
  let minute = Math.trunc(
    60 * (24 * (e - Math.trunc((153 * m + 2) / 5) + 1 + 0.5 - day) - hour) -
      0.808
  );
  if (minute <= 0) minute = +0;
  //в конце вычитаем 48.5 это 0.808 переведенный из десятых в секунды
  let second = Math.trunc(
    60 *
      (60 * (24 * (e - Math.trunc((153 * m + 2) / 5) + 1 + 0.5 - day) - hour) -
        minute) -
      48.5
  );
  if (second <= 0) second = +0;

  //получаем день на 12:00
  return [year, month, day, hour, minute, second];
}

//отличная версия калькуляции, получаем Грег. дату в ET
function sec_jd2000_to_greg_meeus(sec_from_jd2000) {
  //получаем Julian Day
  let jdn = JD2000 + sec_from_jd2000 / SEC_IN_1_DAY;

  jdn += 0.5;

  let A = NaN;

  let Z = Math.trunc(jdn);

  let F = jdn - Z;

  if (Z < 2299161) {
    A = Z;
  } else {
    let alpha = Math.trunc((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.trunc(alpha / 4);
  }

  let B = A + 1524;

  let C = Math.trunc((B - 122.1) / 365.25);

  let D = Math.trunc(365.25 * C);

  let E = Math.trunc((B - D) / 30.6001);

  let day = B - D - Math.trunc(30.6001 * E) + F;

  let month = NaN;

  if (E < 0 || E > 15) {
    console.log(`sec_jd2000_to_greg_meeus, unacceptable value of E`);
    throw 888;
  }

  if (E < 14) {
    month = E - 1;
  } else {
    month = E - 13;
  }

  let year = month > 2 ? C - 4716 : C - 4715;

  let hour = (day - Math.trunc(day)) * 24;

  day = Math.trunc(day);

  let minute = (hour - Math.trunc(hour)) * 60;

  hour = Math.trunc(hour);

  let second = (minute - Math.trunc(minute)) * 60;

  minute = Math.trunc(minute);

  second = Math.ceil(second);

  return [year, month, day, hour, minute, second];
}

// delta_t observations started at 1620 and now it is 2017
// so we have 398 records for now
// each record is the year and a number of seconds
// [0] record corresponds to year 1620
// https://www.staff.science.uu.nl/~gent0113/deltat/deltat.htm
// ftp://maia.usno.navy.mil/ser7/deltat.data

/*
http://astro.ukho.gov.uk/nao/miscellanea/DeltaT/
https://ru.wikipedia.org/wiki/%D0%94%D0%B5%D0%BB%D1%8C%D1%82%D0%B0_T
https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html
https://en.wikipedia.org/wiki/%CE%94T

struct delta_t_table_struct{
    int year;
    double seconds;
};

*/

const full_delta_t_table = [
  [1620, 124],
  [1621, 119],
  [1622, 115],
  [1623, 110],
  [1624, 106],
  [1625, 102],
  [1626, 98],
  [1627, 95],
  [1628, 91],
  [1629, 88],

  [1630, 85],
  [1631, 82],
  [1632, 79],
  [1633, 77],
  [1634, 74],
  [1635, 72],
  [1636, 70],
  [1637, 67],
  [1638, 65],
  [1639, 63],

  [1640, 62],
  [1641, 60],
  [1642, 58],
  [1643, 57],
  [1644, 55],
  [1645, 54],
  [1646, 53],
  [1647, 51],
  [1648, 50],
  [1649, 49],

  [1650, 48],
  [1651, 47],
  [1652, 46],
  [1653, 45],
  [1654, 44],
  [1655, 43],
  [1656, 42],
  [1657, 41],
  [1658, 40],
  [1659, 38],

  [1660, 37],
  [1661, 36],
  [1662, 35],
  [1663, 34],
  [1664, 33],
  [1665, 32],
  [1666, 31],
  [1667, 30],
  [1668, 28],
  [1669, 27],

  [1670, 26],
  [1671, 25],
  [1672, 24],
  [1673, 23],
  [1674, 22],
  [1675, 21],
  [1676, 20],
  [1677, 19],
  [1678, 18],
  [1679, 17],

  [1680, 16],
  [1681, 15],
  [1682, 14],
  [1683, 14],
  [1684, 13],
  [1685, 12],
  [1686, 12],
  [1687, 11],
  [1688, 11],
  [1689, 10],

  [1690, 10],
  [1691, 10],
  [1692, 9],
  [1693, 9],
  [1694, 9],
  [1695, 9],
  [1696, 9],
  [1697, 9],
  [1698, 9],
  [1699, 9],

  [1700, 9],
  [1701, 9],
  [1702, 9],
  [1703, 9],
  [1704, 9],
  [1705, 9],
  [1706, 9],
  [1707, 9],
  [1708, 10],
  [1709, 10],

  [1710, 10],
  [1711, 10],
  [1712, 10],
  [1713, 10],
  [1714, 10],
  [1715, 10],
  [1716, 10],
  [1717, 11],
  [1718, 11],
  [1719, 11],

  [1720, 11],
  [1721, 11],
  [1722, 11],
  [1723, 11],
  [1724, 11],
  [1725, 11],
  [1726, 11],
  [1727, 11],
  [1728, 11],
  [1729, 11],

  [1730, 11],
  [1731, 11],
  [1732, 11],
  [1733, 11],
  [1734, 12],
  [1735, 12],
  [1736, 12],
  [1737, 12],
  [1738, 12],
  [1739, 12],

  [1740, 12],
  [1741, 12],
  [1742, 12],
  [1743, 12],
  [1744, 13],
  [1745, 13],
  [1746, 13],
  [1747, 13],
  [1748, 13],
  [1749, 13],

  [1750, 13],
  [1751, 14],
  [1752, 14],
  [1753, 14],
  [1754, 14],
  [1755, 14],
  [1756, 14],
  [1757, 14],
  [1758, 15],
  [1759, 15],

  [1760, 15],
  [1761, 15],
  [1762, 15],
  [1763, 15],
  [1764, 15],
  [1765, 16],
  [1766, 16],
  [1767, 16],
  [1768, 16],
  [1769, 16],

  [1770, 16],
  [1771, 16],
  [1772, 16],
  [1773, 16],
  [1774, 16],
  [1775, 17],
  [1776, 17],
  [1777, 17],
  [1778, 17],
  [1779, 17],

  [1780, 17],
  [1781, 17],
  [1782, 17],
  [1783, 17],
  [1784, 17],
  [1785, 17],
  [1786, 17],
  [1787, 17],
  [1788, 17],
  [1789, 17],

  [1790, 17],
  [1791, 17],
  [1792, 16],
  [1793, 16],
  [1794, 16],
  [1795, 16],
  [1796, 15],
  [1797, 15],
  [1798, 14],
  [1799, 14],

  [1800, 13.7],
  [1801, 13.4],
  [1802, 13.1],
  [1803, 12.9],
  [1804, 12.7],
  [1805, 12.6],
  [1806, 12.5],
  [1807, 12.5],
  [1808, 12.5],
  [1809, 12.5],

  [1810, 12.5],
  [1811, 12.5],
  [1812, 12.5],
  [1813, 12.5],
  [1814, 12.5],
  [1815, 12.5],
  [1816, 12.5],
  [1817, 12.4],
  [1818, 12.3],
  [1819, 12.3],

  [1820, 12.0],
  [1821, 11.7],
  [1822, 11.4],
  [1823, 11.1],
  [1824, 10.6],
  [1825, 10.2],
  [1826, 9.6],
  [1827, 9.1],
  [1828, 8.6],
  [1829, 8.0],

  [1830, 7.5],
  [1831, 7.0],
  [1832, 6.6],
  [1833, 6.3],
  [1834, 6.0],
  [1835, 5.8],
  [1836, 5.7],
  [1837, 5.6],
  [1838, 5.6],
  [1839, 5.6],

  [1840, 5.7],
  [1841, 5.8],
  [1842, 5.9],
  [1843, 6.1],
  [1844, 6.2],
  [1845, 6.3],
  [1846, 6.5],
  [1847, 6.6],
  [1848, 6.8],
  [1849, 6.9],

  [1850, 7.1],
  [1851, 7.2],
  [1852, 7.3],
  [1853, 7.4],
  [1854, 7.5],
  [1855, 7.6],
  [1856, 7.7],
  [1857, 7.7],
  [1858, 7.8],
  [1859, 7.8],

  [1860, 7.88],
  [1861, 7.82],
  [1862, 7.54],
  [1863, 6.97],
  [1864, 6.4],
  [1865, 6.02],
  [1866, 5.41],
  [1867, 4.1],
  [1868, 2.92],
  [1869, 1.82],

  [1870, 1.61],
  [1871, 0.1],
  [1872, -1.02],
  [1873, -1.28],
  [1874, -2.69],
  [1875, -3.24],
  [1876, -3.64],
  [1877, -4.54],
  [1878, -4.71],
  [1879, -5.1],

  [1880, -5.4],
  [1881, -5.42],
  [1882, -5.2],
  [1883, -5.46],
  [1884, -5.46],
  [1885, -5.79],
  [1886, -5.63],
  [1887, -5.64],
  [1888, -5.8],
  [1889, -5.66],

  [1890, -5.87],
  [1891, -6.01],
  [1892, -6.19],
  [1893, -6.64],
  [1894, -6.44],
  [1895, -6.47],
  [1896, -6.09],
  [1897, -5.76],
  [1898, -4.66],
  [1899, -3.74],

  [1900, -2.72],
  [1901, -1.54],
  [1902, -0.02],
  [1903, 1.24],
  [1904, 2.64],
  [1905, 3.86],
  [1906, 5.37],
  [1907, 6.14],
  [1908, 7.75],
  [1909, 9.13],

  [1910, 10.46],
  [1911, 11.53],
  [1912, 13.36],
  [1913, 14.65],
  [1914, 16.01],
  [1915, 17.2],
  [1916, 18.24],
  [1917, 19.06],
  [1918, 20.25],
  [1919, 20.95],

  [1920, 21.16],
  [1921, 22.25],
  [1922, 22.41],
  [1923, 23.03],
  [1924, 23.49],
  [1925, 23.69],
  [1926, 23.86],
  [1927, 24.49],
  [1928, 24.34],
  [1929, 24.08],

  [1930, 24.02],
  [1931, 24.0],
  [1932, 23.87],
  [1933, 23.95],
  [1934, 23.86],
  [1935, 23.93],
  [1936, 23.73],
  [1937, 23.92],
  [1938, 23.96],
  [1939, 24.02],

  [1940, 24.33],
  [1941, 24.83],
  [1942, 25.3],
  [1943, 25.7],
  [1944, 26.24],
  [1945, 26.77],
  [1946, 27.28],
  [1947, 27.78],
  [1948, 28.25],
  [1949, 28.71],

  [1950, 29.15],
  [1951, 29.57],
  [1952, 29.97],
  [1953, 30.36],
  [1954, 30.72],
  [1955, 31.07],
  [1956, 31.35],
  [1957, 31.68],
  [1958, 32.18],
  [1959, 32.68],

  [1960, 33.15],
  [1961, 33.59],
  [1962, 34.0],
  [1963, 34.47],
  [1964, 35.03],
  [1965, 35.73],
  [1966, 36.54],
  [1967, 37.43],
  [1968, 38.29],
  [1969, 39.2],

  [1970, 40.18],
  [1971, 41.17],
  [1972, 42.23],
  [1973, 43.37],
  [1974, 44.49],
  [1975, 45.48],
  [1976, 46.46],
  [1977, 47.52],
  [1978, 48.53],
  [1979, 49.59],

  [1980, 50.54],
  [1981, 51.38],
  [1982, 52.17],
  [1983, 52.96],
  [1984, 53.79],
  [1985, 54.34],
  [1986, 54.87],
  [1987, 55.32],
  [1988, 55.82],
  [1989, 56.3],

  [1990, 56.86],
  [1991, 57.57],
  [1992, 58.31],
  [1993, 59.12],
  [1994, 59.99],
  [1995, 60.78],
  [1996, 61.63],
  [1997, 62.3],
  [1998, 62.97],
  [1999, 63.47],

  [2000, 63.83],
  [2001, 64.09],
  [2002, 64.3],
  [2003, 64.47],
  [2004, 64.57],
  [2005, 64.69],
  [2006, 64.85],
  [2007, 65.15],
  [2008, 65.46],
  [2009, 65.78],

  [2010, 66.07],
  [2011, 66.32],
  [2012, 66.6],
  [2013, 66.91],
  [2014, 67.28],
  [2015, 67.64],
  [2016, 68.1],
  [2017, 68.59],
];

//https://eclipse.gsfc.nasa.gov/SEhelp/deltaT.html
//This parameter is known as delta-T or ΔT (ΔT = TDT - UT).
// for delta_t calculations we use
// https://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html
// algorithms
function calculate_delta_t(year) {
  let delta_t_sec;

  // before year 1620 (observations started from 1620, before were only estimations)
  if (year < 1620) {
    if (year < -500) {
      delta_t_sec = -20 + 32 * Math.pow((year - 1820) / 100, 2);
      return delta_t_sec;
    } else if (year >= -500 && year <= 500) {
      delta_t_sec =
        10583.6 -
        (1014.41 * year) / 100 +
        33.78311 * Math.pow(year / 100, 2) -
        5.952053 * Math.pow(year / 100, 3) -
        0.1798452 * Math.pow(year / 100, 4) +
        0.022174192 * Math.pow(year / 100, 5) +
        0.0090316521 * Math.pow(year / 100, 6);
      return delta_t_sec;
    } else if (year > 500 && year <= 1600) {
      delta_t_sec =
        1574.2 -
        (556.01 * (year - 1000)) / 100 +
        71.23472 * Math.pow((year - 1000) / 100, 2) +
        0.319781 * Math.pow((year - 1000) / 100, 3) -
        0.8503463 * Math.pow((year - 1000) / 100, 4) -
        0.005050998 * Math.pow((year - 1000) / 100, 5) +
        0.0083572073 * Math.pow((year - 1000) / 100, 6);
      return delta_t_sec;
    } else {
      // from 1600 to 1620
      delta_t_sec =
        120 -
        0.9808 * (year - 1600) -
        0.01532 * Math.pow(year - 1600, 2) +
        Math.pow(year - 1600, 3) / 7129;
      return delta_t_sec;
    }
  }

  if (year >= 1620 && year <= 1700) {
    delta_t_sec =
      120 -
      0.9808 * (year - 1600) -
      0.01532 * Math.pow(year - 1600, 2) +
      Math.pow(year - 1600, 3) / 7129;
    return delta_t_sec;
  }

  if (year > 1700 && year <= 1800) {
    delta_t_sec =
      8.83 +
      0.1603 * (year - 1700) -
      0.0059285 * Math.pow(year - 1700, 2) +
      0.00013336 * Math.pow(year - 1700, 3) -
      Math.pow(year - 1700, 4) / 1174000;
    return delta_t_sec;
  }

  if (year > 1800 && year <= 1860) {
    delta_t_sec =
      13.72 -
      0.332447 * (year - 1800) +
      0.0068612 * Math.pow(year - 1800, 2) +
      0.0041116 * Math.pow(year - 1800, 3) -
      0.00037436 * Math.pow(year - 1800, 4) +
      0.0000121272 * Math.pow(year - 1800, 5) -
      0.0000001699 * Math.pow(year - 1800, 6) +
      0.000000000875 * Math.pow(year - 1800, 7);
    return delta_t_sec;
  }

  if (year > 1860 && year <= 1900) {
    delta_t_sec =
      7.62 +
      0.5737 * (year - 1860) -
      0.251754 * Math.pow(year - 1860, 2) +
      0.01680668 * Math.pow(year - 1860, 3) -
      0.0004473624 * Math.pow(year - 1860, 4) +
      Math.pow(year - 1860, 5) / 233174;
    return delta_t_sec;
  }

  if (year > 1900 && year <= 1920) {
    delta_t_sec =
      -2.79 +
      1.494119 * (year - 1900) -
      0.0598939 * Math.pow(year - 1900, 2) +
      0.0061966 * Math.pow(year - 1900, 3) -
      0.000197 * Math.pow(year - 1900, 4);
    return delta_t_sec;
  }

  if (year > 1920 && year <= 1941) {
    delta_t_sec =
      21.2 +
      0.84493 * (year - 1920) -
      0.0761 * Math.pow(year - 1920, 2) +
      0.0020936 * Math.pow(year - 1920, 3);
    return delta_t_sec;
  }

  if (year > 1941 && year <= 1961) {
    delta_t_sec =
      29.07 +
      0.407 * (year - 1950) -
      Math.pow(year - 1950, 2) / 233.0 +
      Math.pow(year - 1950, 3) / 2547.0;
    return delta_t_sec;
  }

  if (year > 1961 && year <= 1986) {
    delta_t_sec =
      45.45 +
      1.067 * (year - 1975) -
      Math.pow(year - 1975, 2) / 260.0 -
      Math.pow(year - 1975, 3) / 718.0;
    return delta_t_sec;
  }

  if (year > 1986 && year <= 2005) {
    delta_t_sec =
      63.86 +
      0.3345 * (year - 2000) -
      0.060374 * Math.pow(year - 2000, 2) +
      0.0017275 * Math.pow(year - 2000, 3) +
      0.000651814 * Math.pow(year - 2000, 4) +
      0.00002373599 * Math.pow(year - 2000, 5);
    return delta_t_sec;
  }

  if (year > 2005 && year <= 2050) {
    delta_t_sec =
      62.92 + 0.32217 * (year - 2000) + 0.005589 * Math.pow(year - 2000, 2);
    return delta_t_sec;
  }

  if (year > 2050 && year <= 2150) {
    delta_t_sec =
      -20 + 32 * Math.pow((year - 1820) / 100.0, 2) - 0.5628 * (2150 - year);
    return delta_t_sec;
  }

  if (year > 2150) {
    delta_t_sec = -20 + 32 * Math.pow((year - 1820) / 100.0, 2);
    return delta_t_sec;
  }

  return -1;
}

function show_delta_t(year) {
  if (year < 1620 || year > 2017) {
    return calculate_delta_t(year);
  }

  return full_delta_t_table[year - 1620][1];
}

// converts date to timestamp
// https://www.unixtimestamp.com/
// https://stackoverflow.com/questions/9873197/convert-date-to-timestamp-in-javascript
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC
// input format - {input_year, input_month, input_day, input_hour, input_minutes, input_seconds}
function date_to_timestamp(date) {
  return (
    new Date(
      Date.UTC(
        date.input_year,
        date.input_month - 1,
        date.input_day,
        date.input_hour,
        date.input_minutes,
        date.input_seconds
      )
    ).getTime() / 1000
  );
}

// Принимает JED и перводит его в sec_from_jd2000
function jed_to_sec_from_jd2000(date) {
  return (date - JD2000) * SEC_IN_1_DAY;
}

module.exports.jed_to_sec_from_jd2000 = jed_to_sec_from_jd2000;
module.exports.date_to_timestamp = date_to_timestamp;
module.exports.sec_jd2000_to_greg_meeus = sec_jd2000_to_greg_meeus;
module.exports.sec_from_jd2000_to_gregdate = sec_from_jd2000_to_gregdate;
module.exports.gregdate_to_sec_from_j2000 = gregdate_to_sec_from_j2000;
module.exports.show_delta_t = show_delta_t;
