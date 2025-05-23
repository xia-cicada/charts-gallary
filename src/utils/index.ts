import Swal, { type SweetAlertIcon } from 'sweetalert2'
import { echarts } from '~/libs/echarts'

export const showNotification = (text: string, type?: SweetAlertIcon) => {
  Swal.fire({
    position: 'top-end',
    icon: type,
    titleText: text,
    showConfirmButton: false,
    timer: 1500,
    theme: 'dark',
  })
}

export const insEcharts = (el: HTMLElement) => {
  const isDarkMode =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  return echarts.init(el, isDarkMode ? 'dark' : 'light')
}
