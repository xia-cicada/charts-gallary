import Swal, { type SweetAlertIcon } from 'sweetalert2'

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
