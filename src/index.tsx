/* @refresh reload */
import { render } from 'solid-js/web'
import './styles/index.css'
import '/node_modules/flag-icons/css/flag-icons.min.css'
import App from './App.tsx'
import { Router, Route } from '@solidjs/router'
import { For, lazy, type Component } from 'solid-js'

const root = document.getElementById('root')

// 生成Demo路由
const demoComponents = Object.entries(
  import.meta.glob<{ default: Component }>('./demos/*/index.tsx')
).map(([path, loader]) => ({
  path: path.replace(/.*demos\/(.*)\/index\.tsx/, '$1').toLowerCase(),
  component: lazy(loader),
}))

render(
  () => (
    <Router>
      <Route path="/" component={App}></Route>
      <Route path="/demo">
        <For each={demoComponents}>
          {({ path, component }) => {
            return <Route path={path} component={component}></Route>
          }}
        </For>
      </Route>
    </Router>
  ),
  root!
)
