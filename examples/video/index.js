const $video = document.querySelector('#video')
const $screenshotBtn = document.querySelector('#screenshotBtn')
const $screenshotCanvas = document.querySelector('#screenshotCanvas')
const $dialog = document.querySelector('.dialog')
const $saveBtn = document.querySelector('#saveBtn')

const draw = new Draw(document.querySelector('#drawBox'), {
  toolbar: 'color line rectangle circle eraser textarea fontSize'
})

$screenshotBtn.onclick = function(){
  $video.pause()
  $screenshotCanvas.getContext('2d').drawImage($video, 0, 0, $video.videoWidth, $video.videoHeight)
  draw.input($screenshotCanvas.toDataURL())
  $dialog.style.display = 'block'
}

$saveBtn.onclick = function(){
  draw.output().then(data => {
    const $img = document.querySelector('#preview')
    $img.style.display = 'block'
    $img.src = data
    $dialog.style.display = 'none'
    $video.play()
  })
}