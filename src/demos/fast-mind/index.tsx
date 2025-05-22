import { onMount, createSignal, createEffect, onCleanup } from 'solid-js'
import { useGUI } from '~/composables/useGUI'
import { usePrompt } from '~/composables/usePrompt'
import { echarts } from '~/libs/echarts'
import { storageService, type StoredChartData } from './storage'
import { showNotification } from '~/utils'
import type { BladeApi } from 'tweakpane'

interface Node {
  id: string
  name: string
  symbolSize?: number
  category?: number
  x?: number
  y?: number
}

interface Link {
  source: string
  target: string
}

interface Category {
  name: string
}

interface Config {
  nodeSize: number
  linkWidth: number
  saveTmpData: () => void
  loadTmpData: () => void
}

const Graph01 = () => {
  const config0: Config = {
    nodeSize: 30,
    linkWidth: 2,
    saveTmpData: () => saveTmpData(),
    loadTmpData: () => loadTmpData(),
  }

  const [config, setConfig] = createSignal({ ...config0 })
  const gui = useGUI<Config>(config0, {
    nodeSize: { min: 20, max: 60, step: 5, label: '节点大小' },
    linkWidth: { min: 1, max: 6, step: 1, label: '连线宽度' },
    saveTmpData: { title: '保存临时数据' },
    loadTmpData: { title: '加载临时数据' },
  })
  gui.onChange((v, k) => {
    setConfig(v)
    if (k === 'nodeSize') {
      setNodes(nodes().map((n) => ({ ...n, symbolSize: v[k] })))
    }
  })

  let chartContainer: HTMLDivElement
  let chartInstance: echarts.ECharts
  const [nodes, setNodes] = createSignal<Node[]>([])
  const [links, setLinks] = createSignal<Link[]>([])
  const [categories, setCategories] = createSignal<Category[]>([])
  const [selectedNode, setSelectedNode] = createSignal<Node | null>(null)
  const nodeSize = () => config().nodeSize
  const linkWidth = () => config().linkWidth

  // 数据保存和加载
  const [lastSaved, setLastSaved] = createSignal<string | null>(null)
  const [isLoading, setIsLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  // 初始化数据
  const initData = () => {
    const initialNodes: Node[] = [
      { id: '1', name: '起始', symbolSize: nodeSize(), category: 0 },
    ]

    const initialLinks: Link[] = [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
    ]

    const initialCategories: Category[] = [{ name: '默认类别' }]

    setNodes(initialNodes)
    setLinks(initialLinks)
    setCategories(initialCategories)
  }

  // 初始化图表
  const initChart = () => {
    chartInstance = echarts.init(chartContainer!, 'dark')

    const updateChart = () => {
      const option: echarts.EChartsOption = {
        tooltip: {},
        legend: {
          data: categories().map((c) => c.name),
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            data: nodes(),
            links: links(),
            categories: categories(),
            roam: true,
            tooltip: { show: false },
            label: {
              show: true,
              position: 'right',
            },
            edgeLabel: {
              show: false,
            },
            emphasis: {
              focus: 'adjacency',
              label: {
                color: '#E0675F',
              },
            },
            blur: {
              itemStyle: {
                opacity: 0.6,
                color: '#8A5B46',
              },
              label: {
                opacity: 0.6,
                color: '#8A5B46',
              },
            },
            draggable: true,
            lineStyle: {
              width: linkWidth(),
              curveness: 0.2,
            },
            symbolSize: nodeSize(),
            force: {
              repulsion: 200,
              edgeLength: 100,
            },
          },
        ],
      }

      chartInstance.setOption(option)
    }

    // 监听数据变化
    createEffect(updateChart)

    // 右键点击事件
    chartInstance.on('contextmenu', (params: any) => {
      if (params.dataType === 'node') {
        const node = nodes().find((n) => n.id === params.data.id)
        if (node) {
          setSelectedNode(node)
          toAddNode(node)
        }
      }
    })

    // 点击空白处取消选择
    chartInstance.on('click', (params: any) => {
      if (!params.dataType) {
        setSelectedNode(null)
      } else if (params.dataType === 'node') {
        const node = nodes().find((n) => n.id === params.data.id)
        if (node) {
          toEditNode(node)
        }
      }
    })

    // 窗口大小变化时重绘
    window.addEventListener('resize', () => chartInstance.resize())

    // 初始化数据
    initData()
  }

  const { showPrompt } = usePrompt()
  // 弹出添加新节点的配置
  const toAddNode = async (sourceNode: Node) => {
    const d = await showPrompt({ title: '名称' })
    if (d.confirmed) {
      addNode(sourceNode, d.value)
    } else {
      setSelectedNode(null)
    }
  }

  const toEditNode = async (sourceNode: Node) => {
    const d = await showPrompt({ title: '名称', inputValue: sourceNode.name })
    if (d.confirmed) {
      sourceNode.name = d.value
      setNodes([...nodes()])
    } else {
      setSelectedNode(null)
    }
  }

  // 添加新节点
  const addNode = (sourceNode: Node, nodeName: string) => {
    const newNodeId = (nodes().length + 1).toString()
    const newNode: Node = {
      id: newNodeId,
      name: nodeName,
      symbolSize: nodeSize(),
      category: 0,
    }

    const newLink: Link = {
      source: sourceNode.id,
      target: newNodeId,
    }

    setNodes([...nodes(), newNode])
    setLinks([...links(), newLink])
  }

  // 保存临时数据，保存在indexedDB里
  const saveTmpData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const currentData = getCurrentChartData() // 获取当前图表数据的函数
      await storageService.saveChartData(currentData)
      const savedTime = await storageService.getLastSavedTime()
      setLastSaved(savedTime || '刚刚')
      showNotification('保存成功', 'success')
    } catch (err) {
      showNotification('保存数据失败', 'error')
      setError('保存数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 加载保存的临时数据
  const loadTmpData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const savedData = await storageService.loadChartData()
      if (savedData) {
        updateChartWithData(savedData) // 更新图表的函数
        setLastSaved(savedData.updatedAt)
        showNotification('加载数据成功', 'success')
      } else {
        showNotification('没有找到保存的数据', 'info')
        setError('没有找到保存的数据')
      }
    } catch (err) {
      showNotification('加载数据失败', 'error')
      setError('加载数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentChartData = () => {
    return {
      title: 'FAST-MIND',
      data: nodes(),
      links: links(),
      config: {
        nodeSize: nodeSize(),
        linkWidth: linkWidth(),
      },
    }
  }

  const updateChartWithData = (d: StoredChartData) => {
    setNodes(d.data as Node[])
    setLinks(d.links as Link[])
    setConfig({ ...config(), ...d.config })
    gui.setNewModel(config())
  }

  // 删除保存的数据
  const deleteSavedData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await storageService.deleteChartData()
      setLastSaved(null)
    } catch (err) {
      showNotification('删除数据失败', 'error')
      setError('删除数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  onMount(() => {
    initChart()
  })

  onCleanup(() => {
    // gui.dispose()
  })

  return (
    <div class="screen-ctn">
      <div
        ref={chartContainer!}
        style={{ height: '100%' }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  )
}

export default Graph01
