import Draw from '../../lib'
import '../../lib/theme/index.scss'

import './index.scss'
import imgUrl from './xxx.jpeg'


const draw = new Draw(document.querySelector('#drawBox'), {
  background: imgUrl,
  toolbar: 'color line rectangle circle eraser textarea fontSize'
})

document.querySelector('#saveBtn').onclick = () => {
  draw.output().then(data => {
    const $img = document.querySelector('#preview')
    $img.style.display = 'block'
    $img.src = data
  })
}
