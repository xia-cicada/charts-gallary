import { cloneDeep } from 'es-toolkit'
import { onCleanup } from 'solid-js'
import { type BindingParams, type ButtonParams, Pane } from 'tweakpane'
import type { PaneConfig } from 'tweakpane/dist/types/pane/pane-config'

// GUI 配置映射表
type PaneParamsMap<T> = {
  [K in keyof T]?: BindingParams | ButtonParams
}

export function useGUI<T extends object>(
  model: T,
  configMap: PaneParamsMap<T> = {},
  config: PaneConfig & { onReset?: () => void } = {}
) {
  const originalModel = cloneDeep(model)
  const pane = new Pane(config)
  if (config.title) {
    document.title = config.title
  }

  ;(Object.keys(model) as Array<keyof T>).forEach((key) => {
    const params = configMap[key] || {}
    if (typeof model[key] === 'function') {
      pane
        .addButton(params as ButtonParams)
        .on('click', model[key] as () => void)
    } else {
      pane.addBinding(model, key, params as BindingParams)
    }
  })

  // 添加重置按钮
  pane.addButton({ title: '重置' }).on('click', () => {
    Object.assign(model, originalModel)
    pane.refresh()
    if (typeof config.onReset === 'function') config.onReset()
  })

  // 清理
  onCleanup(() => pane.dispose())

  return {
    pane,
    model,
    dispose: () => {
      pane.dispose()
    },
    setNewModel: (newModel: T) => {
      Object.assign(model, newModel)
      pane.refresh()
    },
    onChange: (callback: (newConfig: T, key?: keyof T) => void) => {
      pane.on('change', (ev) => {
        callback(
          { ...model },
          //@ts-ignore
          ev.target.key as keyof T
        )
      })
    },
  }
}
