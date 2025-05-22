import { createSignal } from 'solid-js'
import Swal, { type SweetAlertInput, type SweetAlertTheme } from 'sweetalert2'

/**
 * 自定义提示框 Hook
 * @returns 提供 showPrompt 方法的对象
 */
export function usePrompt() {
  const [response, setResponse] = createSignal<{
    confirmed: boolean
    value?: string
  } | null>(null)

  /**
   * 显示提示框
   * @param options SweetAlert2 配置选项
   * @returns Promise 包含用户响应
   */
  const showPrompt = async (
    options: {
      title?: string
      text?: string
      input?: SweetAlertInput
      inputValue?: string
      inputOptions?: Record<string, string> | Map<string, string>
      inputPlaceholder?: string
      inputAttributes?: Record<string, string>
      confirmButtonText?: string
      cancelButtonText?: string
      showCancelButton?: boolean
      validationMessage?: string
      theme?: SweetAlertTheme
    } = {}
  ) => {
    const result = await Swal.fire({
      title: options.title || '请输入',
      text: options.text,
      input: options.input || 'text',
      inputValue: options.inputValue || '',
      inputOptions: options.inputOptions,
      inputPlaceholder: options.inputPlaceholder || '',
      inputAttributes: options.inputAttributes,
      showCancelButton: options.showCancelButton !== false,
      confirmButtonText: options.confirmButtonText || '确认',
      cancelButtonText: options.cancelButtonText || '取消',
      allowOutsideClick: false,
      theme: options.theme || 'dark',
      preConfirm: (inputValue) => {
        if (!inputValue && options.validationMessage) {
          Swal.showValidationMessage(options.validationMessage)
          return false
        }
        return inputValue
      },
    })

    const responseValue = {
      confirmed: result.isConfirmed,
      value: result.value,
    }

    setResponse(responseValue)
    return responseValue
  }

  return {
    showPrompt,
    response,
  }
}
