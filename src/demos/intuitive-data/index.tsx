import ky from 'ky'
import { onMount } from 'solid-js'
import { echarts } from '~/libs/echarts'
import { insEcharts } from '~/utils'

interface Flag {
  name: string
  emoji: string
}

// 更明确的生命周期数据接口
interface LifeExpectancyDataItem extends Array<string | number> {
  0: number // 值
  1: number // 可能的值2
  2: number // 可能的值3
  3: string // 国家名称
  4: string // 年份
}

const COUNTRY_COLORS: Record<string, string> = {
  Australia: '#4CC9F0',
  Canada: '#FF6D6D',
  China: '#FFD700',
  Cuba: '#70D6FF',
  Finland: '#9B5DE5',
  France: '#F72585',
  Germany: '#E0E0E0',
  Iceland: '#00F5D4',
  India: '#FF9E00',
  Japan: '#EF476F',
  'North Korea': '#7209B7',
  'South Korea': '#B5E48C',
  'New Zealand': '#4895EF',
  Norway: '#FF6D00',
  Poland: '#FF0054',
  Russia: '#FF2D00',
  Turkey: '#FF5400',
  'United Kingdom': '#3A86FF',
  'United States': '#FF206E',
}

const UPDATE_FREQUENCY = 2000
const DIMENSION = 0
const INITIAL_YEAR_INDEX = 10
const MAX_COUNTRIES_DISPLAYED = 15

export default function IntuitiveData() {
  let refChart: HTMLDivElement | undefined
  let chart: echarts.ECharts

  onMount(() => {
    chart = insEcharts(refChart!)
    initCharts()
  })

  const getFlag = (flags: Flag[], countryName: string): string => {
    if (!countryName) return ''
    return flags.find((item) => item.name === countryName)?.emoji || ''
  }

  const getYearList = (data: LifeExpectancyDataItem[]): string[] => {
    const years: string[] = []
    data.forEach((item) => {
      const year = item[4]
      if (years.length === 0 || years[years.length - 1] !== year) {
        years.push(year)
      }
    })
    return years
  }

  const getInitialOption = (
    data: LifeExpectancyDataItem[],
    flags: Flag[],
    startYear: string
  ): echarts.EChartsOption => {
    const dataset: echarts.DatasetComponentOption = {
      source: data.filter((d) => d[4] === startYear),
    }

    return {
      grid: {
        top: 10,
        bottom: 30,
        left: 150,
        right: 80,
      },
      xAxis: {
        max: 'dataMax',
        axisLabel: {
          formatter: (n: number) => Math.round(n).toString(),
        },
      },
      dataset,
      yAxis: {
        type: 'category',
        inverse: true,
        max: MAX_COUNTRIES_DISPLAYED,
        axisLabel: {
          show: true,
          fontSize: 14,
          formatter: (value: string) =>
            `${value}{flag|${getFlag(flags, value)}}`,
          rich: {
            flag: {
              fontSize: 25,
              padding: 5,
            },
          },
        },
        animationDuration: 300,
        animationDurationUpdate: 300,
      },
      series: [
        {
          realtimeSort: true,
          seriesLayoutBy: 'column',
          type: 'bar',
          itemStyle: {
            color: (param: any) => COUNTRY_COLORS[param.value[3]] || '#5470c6',
          },
          encode: {
            x: DIMENSION,
            y: 3,
          },
          label: {
            show: true,
            precision: 1,
            position: 'right',
            valueAnimation: true,
            fontFamily: 'monospace',
          },
        },
      ],
      animationDuration: 0,
      animationDurationUpdate: UPDATE_FREQUENCY,
      animationEasing: 'linear',
      animationEasingUpdate: 'linear',
      graphic: {
        elements: [
          {
            type: 'text',
            right: 160,
            bottom: 60,
            style: {
              text: startYear,
              font: 'bolder 80px monospace',
              fill: 'rgba(125, 153, 171, 0.25)',
            },
            z: 100,
          },
        ],
      },
    }
  }

  const updateYear = (
    chart: echarts.ECharts,
    year: string,
    data: LifeExpectancyDataItem[]
  ) => {
    const dataset: echarts.DatasetComponentOption = {
      source: data.filter((d) => d[4] === year),
    }

    const option: echarts.EChartsOption = {
      dataset,
      graphic: {
        elements: [
          {
            style: {
              text: year,
              font: 'bolder 80px monospace',
              fill: 'rgba(125, 153, 171, 0.25)',
            },
          },
        ],
      },
    }
    chart.setOption(option)
  }

  const initCharts = async () => {
    try {
      const [flags, rawData] = await Promise.all([
        ky.get('/data/emoji-flags.json').json<Flag[]>(),
        ky
          .get('/data/life-expectancy-table.json')
          .json<LifeExpectancyDataItem[]>(),
      ])

      // Skip header row
      const data = rawData.slice(1) as LifeExpectancyDataItem[]
      const years = getYearList(data)
      const startYear = years[INITIAL_YEAR_INDEX]

      const option = getInitialOption(data, flags, startYear)
      chart.setOption(option)

      // Schedule year updates
      years.slice(INITIAL_YEAR_INDEX + 1).forEach((year, i) => {
        setTimeout(() => {
          updateYear(chart, year, data)
        }, (i + 1) * UPDATE_FREQUENCY)
      })
    } catch (error) {
      console.error('Failed to initialize charts:', error)
    }
  }

  return (
    <div class="intuitive-data screen-ctn">
      <div class="h-full" ref={refChart}></div>
    </div>
  )
}
