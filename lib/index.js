import { hasClass, addClass, removeClass } from './utils/jq'
import { getDistance } from './utils'
import colorGroup from './utils/colors'
import html2canvas from 'html2canvas'

export default class Draw {
  constructor($targetElem, options) {
    if ($targetElem === null) {
      console.error('$targetElem does not exist')
      return
    }

    const o = Object.assign({
      background: '',
      className: 'drawarea',
      toolbar: 'color line rectangle circle eraser textarea fontSize',
      fontSize: {
        list: [12, 14, 16, 18, 20, 24, 28, 32, 36, 40],
        value: 14
      },
      style: {
        lineWidth: 5, // 线条长度
        strokeStyle: '#B71C1C', // 线条颜色
        shadowColor: 'rgba(0,0,0,0)', // 阴影颜色
        shadowOffsetX: 0, // 阴影X轴偏移
        shadowOffsetY: 0, // 阴影Y轴偏移
        shadowBlur: 10, // 模糊尺寸
        lineCap: 'round', // 线条样式
      }
    }, options)

    const $container = document.createElement('div')
    const $board = document.createElement('div')
    const $tool = document.createElement('div')
    const $img = new Image()
    const $canvas = document.createElement('canvas')
    const $previewCanvas = document.createElement('canvas')
    const ctx = $canvas.getContext('2d')
    const previewCtx = $previewCanvas.getContext('2d')

    this.options = o
    this.$targetElem = $targetElem
    this.$tool = $tool
    this.$board = $board
    this.$img = $img
    this.$canvas = $canvas
    this.$previewCanvas = $previewCanvas
    this.ctx = ctx
    this.previewCtx = previewCtx
    this.type = ''
    this.startPoint = {
      x: 0,
      y: 0
    }
    this.oldPoint = {
      x: 0,
      y: 0
    }
    this.textarea = {}
    this.color = {}

    if (o.toolbar) {
      const toolList = o.toolbar.trim().replace(/\s{2,}/g, ' ').split(' ')
      if (toolList.includes('textarea')) {
        this.textarea = Object.assign(this.textarea, this._createTextarea())
        $board.appendChild(this.textarea.$textarea)
      }
      toolList.forEach(tool => {
        let $elem
        if (tool === 'fontSize') {
          $elem = document.createElement('select')
          o.fontSize.list.forEach(size => {
            const $option = document.createElement('option')
            $option.value = size
            $option.text = size
            $option.selected = size === o.fontSize.value
            $elem.appendChild($option)
          })
        } else if (tool === 'color') {
          $elem = document.createElement('div')
          $elem.style.backgroundColor = o.style.strokeStyle
          const obj = this._createColorPicker(color => {
            $elem.style.backgroundColor = color
            this.options.style.strokeStyle = color
            const $textarea = this.textarea.$textarea
            if ($textarea) {
              $textarea.style.color = color
            }
          })
          this.color = Object.assign(this.color, obj)
          $elem.appendChild(this.color.$colorPiker)
        } else {
          $elem = document.createElement('button')
          $elem.innerText = tool
        }
        $elem.setAttribute('type', tool)
        addClass($elem, `${o.className}-tool-${tool}`)
        $tool.appendChild($elem)
        this._addEvent($elem, tool)
      })
    }

    addClass($targetElem, o.className)
    addClass($container, `${o.className}-container`)
    addClass($tool, `${o.className}-tool`)
    addClass($board, `${o.className}-board`)
    addClass($img, `${o.className}-img`)
    addClass($canvas, `${o.className}-canvas`)
    addClass($previewCanvas, `${o.className}-canvas-preview`)

    $board.appendChild($img)
    $board.appendChild($canvas)
    $board.appendChild($previewCanvas)
    $container.appendChild($tool)
    $container.appendChild($board)
    $targetElem.appendChild($container)

    this._addCanvasEvent()
    this.input(o.background)
  }

  input(background) {
    const $img = this.$img
    const $canvas = this.$canvas
    const $previewCanvas = this.$previewCanvas
    const $textarea = this.textarea.$textarea
    if (/\.(png|jpg|gif|svg|jpeg)$/.test(background) || /^data:image\/(png|jpg|gif|svg|jpeg);base64/.test(background)) {
      $img.src = background
      $img.onload = () => {
        const w = $img.width
        const h = $img.height
        $canvas.width = w
        $canvas.height = h
        $previewCanvas.width = w
        $previewCanvas.height = h
        if ($textarea) {
          $textarea.style.width = w + 'px'
          $textarea.style.height = h + 'px'
        }
      }
    }
  }

  output() {
    const $canvas = document.createElement('canvas')
    const ctx = $canvas.getContext('2d')
    $canvas.width = this.$canvas.width
    $canvas.height = this.$canvas.height
    return new Promise((resolve, reject) => {
      const $img = new Image()
      $img.onload = () => {
        ctx.drawImage(this.$img, 0, 0)
        ctx.drawImage($img, 0, 0)
        resolve($canvas.toDataURL())
      }
      $img.onerror = error => {
        reject(error)
      }
      $img.src = this.$canvas.toDataURL()
    })
  }

  _addEvent($elem, type) {
    const $board = this.$board
    const $tool = this.$tool
    const method = type === 'fontSize' ? 'change' : 'click'
    $elem.addEventListener(method, e => {
      if (type === 'fontSize') {
        const size = e.target.value
        const $textarea = this.textarea.$textarea
        this.options.fontSize.value = size
        if ($textarea) {
          $textarea.style.fontSize = size + 'px'
        }
      } else if (type === 'color'){
        this._toggleStatus(this.color.$colorPiker)
      } else {
        if (hasClass($elem, 'active')) {
          removeClass($elem, 'active')
          this.type = ''
        } else {
          const $lastActiveBtn = Array.prototype.filter.call($tool.querySelectorAll('button'), child => hasClass(child, 'active'))[0]
          if ($lastActiveBtn) {
            removeClass($lastActiveBtn, 'active')
            removeClass($board, $lastActiveBtn.getAttribute('type'))
          }
          addClass($elem, 'active')
          addClass($board, type)
          this.type = type
        }
        this._clearPreviewCanvas()
        this._togglePreviewCanvas()
        this._toggleStatus(this.color.$colorPiker, false)
        this._toggleStatus(this.textarea.$textarea, type === 'textarea' && hasClass($elem, 'active'))
        this.textarea.reset && this.textarea.reset()
      }
    })
  }

  _isShowPreview() {
    return ['circle', 'rectangle'].includes(this.type)
  }

  _addCanvasEvent() {
    const that = this
    const $canvas = this.$canvas
    const $previewCanvas = this.$previewCanvas
    const ctx = this.ctx
    const previewCtx = this.previewCtx
    const $body = document.querySelector('body')

    $canvas.addEventListener('mousedown', mousedown)
    $previewCanvas.addEventListener('mousedown', mousedown)

    function mousedown(e) {
      if (!that.type) return

      const x = e.offsetX
      const y = e.offsetY
      const isShowPreview = that._isShowPreview()

      that.startPoint = {
        x: x,
        y: y
      }

      that.oldPoint = {
        x: x - 1,
        y: y - 1
      }

      that[`_${that.type}`](isShowPreview ? previewCtx : ctx, x, y, isShowPreview)

      this.addEventListener('mousemove', move)
      this.addEventListener('mouseup', isShowPreview ? handleMouseUp : handleBodyMouseUp)
      $body.addEventListener('mouseup', handleBodyMouseUp)
    }

    // move事件
    function move(e) {
      const x = e.offsetX
      const y = e.offsetY
      const isShowPreview = that._isShowPreview()

      that[`_${that.type}`](isShowPreview ? previewCtx : ctx, x, y, isShowPreview)

      that.oldPoint = {
        x: x,
        y: y
      }
    }

    function handleMouseUp(e) {
      that[`_${that.type}`](ctx, e.offsetX, e.offsetY, false)
    }

    function handleBodyMouseUp() {
      that._clearPreviewCanvas()
      $previewCanvas.removeEventListener('mousemove', move)
      $previewCanvas.removeEventListener('mouseup', handleMouseUp)
      $canvas.removeEventListener('mousemove', move)
      $canvas.removeEventListener('mouseup', handleBodyMouseUp)
      $body.removeEventListener('mouseup', handleBodyMouseUp)
    }
  }

  // 绘制线条
  _line(ctx, x, y) {
    ctx.beginPath()
    this._setStyle(ctx)
    ctx.moveTo(x, y)
    ctx.lineTo(this.oldPoint.x, this.oldPoint.y)
    ctx.stroke()
    ctx.closePath()
  }

  // 橡皮擦
  _eraser(ctx, x, y) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, 20, 0, Math.PI * 2, false)
    ctx.clip()
    ctx.clearRect(0, 0, this.$canvas.width, this.$canvas.height)
    ctx.restore()
  }

  // 绘制圆圈
  _circle(ctx, x, y, isShowPreview) {
    const startPoint = this.startPoint
    const centerPointX = (x + startPoint.x) / 2
    const centerPointY = (y + startPoint.y) / 2
    const distance = getDistance(x, startPoint.x, y, startPoint.y)
    if (isShowPreview) {
      this._clearPreviewCanvas()
    }
    ctx.beginPath()
    this._setStyle(ctx)
    ctx.arc(centerPointX, centerPointY, distance / 2, 0, 2 * Math.PI)
    ctx.stroke()
  }

  // 绘制矩形
  _rectangle(ctx, x, y, isShowPreview) {
    const startPoint = this.startPoint
    const width = Math.abs(startPoint.x - x)
    const height = Math.abs(startPoint.y - y)
    // 计算左上角位置
    const startX = startPoint.x < x ? startPoint.x : x
    const startY = startPoint.y < y ? startPoint.y : y
    if (isShowPreview) {
      this._clearPreviewCanvas()
    }
    ctx.beginPath()
    this._setStyle(ctx)
    ctx.rect(startX, startY, width, height)
    ctx.stroke()
  }

  _clearPreviewCanvas() {
    this.previewCtx.clearRect(0, 0, this.$previewCanvas.width, this.$previewCanvas.height)
  }

  _togglePreviewCanvas() {
    this.$previewCanvas.style.display = this._isShowPreview() ? 'block' : 'none'
  }

  _setStyle(ctx) {
    const obj = this.options.style
    Object.keys(obj).forEach(key => {
      ctx[key] = obj[key]
    })
  }

  _createColorPicker(callback) {
    const activeColor = this.options.style.strokeStyle
    const $div = document.createElement('div')
    colorGroup.forEach(colors => {
      const $section = document.createElement('div')
      colors.forEach(color => {
        const $span = document.createElement('span')
        $span.style.backgroundColor = color
        $span.setAttribute('color', color)
        if (color === '#FFFFFF') {
          addClass($span, 'white')
        }
        if (color === activeColor) {
          addClass($span, 'active')
        }
        $span.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>'
        $section.appendChild($span)
      })
      $div.appendChild($section)
    })
    $div.addEventListener('click', e => {
      e.stopPropagation()
      const $elem = e.target
      if ($elem && $elem.nodeName.toUpperCase() === 'SPAN') {
        if (!hasClass($elem, 'active')) {
          const $lastActiveElem = Array.prototype.filter.call($div.querySelectorAll('span'), child => hasClass(child, 'active'))[0]
          const color = $elem.getAttribute('color')
          if ($lastActiveElem) {
            removeClass($lastActiveElem, 'active')
          }
          addClass($elem, 'active')
          this._toggleStatus($div)
          callback && callback(color)
        }
      }
    })
    return {
      $colorPiker: $div
    }
  }

  _toggleStatus($elem, status) {
    if ($elem) {
      if (status === undefined) {
        if (hasClass($elem, 'show')) {
          removeClass($elem, 'show')
        } else {
          addClass($elem, 'show')
        }
      } else {
        if (status) {
          addClass($elem, 'show')
        } else {
          removeClass($elem, 'show')
        }
      }
    }
  }

  _createTextarea() {
    const o = this.options
    const $textarea = document.createElement('div')
    const $box = document.createElement('div')
    const $text = document.createElement('div')
    const $border = document.createElement('div')
    const $sure = document.createElement('button')
    const $cancel = document.createElement('button')
    let x = 0
    let y = 0
    let offsetX = 0
    let offsetY = 0
    let isDrag = false

    function reset() {
      $box.style.left = '30px'
      $box.style.top = '30px'
      $text.innerHTML = ''
    }

    reset()

    addClass($textarea, `${o.className}-textarea`)
    addClass($box, `${o.className}-textarea-box`)
    addClass($text, `${o.className}-textarea-text`)
    addClass($border, `${o.className}-textarea-border`)
    addClass($sure, `${o.className}-textarea-sure`)
    addClass($cancel, `${o.className}-textarea-cancel`)

    $text.contentEditable = true
    $textarea.style.color = o.style.strokeStyle
    $textarea.style.fontSize = o.fontSize.value + 'px'
    $cancel.setAttribute('type', 'textarea')

    $sure.addEventListener('click', () => {
      const width = $text.clientWidth
      const height = $text.clientHeight

      html2canvas($text, {
        backgroundColor: 'transparent',
        scale: window.devicePixelRatio,
        width, height,
      }).then((canvas) => {
        const img = new Image()
        img.src = canvas.toDataURL('image/png')
        img.onload = () => {
          this.ctx.drawImage(img, $box.offsetLeft, $box.offsetTop, width, height)
          $cancel.click()
        }
      })
    })

    $cancel.addEventListener('click', () => {
      this.$tool.querySelector('[type=textarea]').click()
    })

    $border.addEventListener('mousedown', e => {
      x = e.clientX
      y = e.clientY

      offsetX = $box.offsetLeft
      offsetY = $box.offsetTop

      $box.style.width = $box.clientWidth + 1 + 'px'
      $box.style.height = $box.clientHeight + 'px'

      isDrag = true
    })

    document.addEventListener('mousemove', e => {
      if (!isDrag) return false

      const currX = e.clientX
      const currY = e.clientY

      $box.style.left = offsetX + (currX - x) + 'px'
      $box.style.top = offsetY + (currY - y) + 'px'
    })

    document.addEventListener('mouseup', () => {
      $box.style.width = ''
      $box.style.height = ''
      isDrag = false
    })

    $box.appendChild($text)
    $box.appendChild($border)
    $box.appendChild($sure)
    $box.appendChild($cancel)
    $textarea.appendChild($box)

    return {
      $textarea,
      reset
    }
  }
}
