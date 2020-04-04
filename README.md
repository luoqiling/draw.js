# draw

## 简介

绘画工具：直线、圆形、矩形、橡皮擦、文本框、拾色器

## 预览

[请狠狠地点这里](https://luobin01.github.io/draw/examples/video/)

## 示例

````
const draw = new Draw(document.querySelector('xxx'), {
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
})

// 输入
draw.input(imgSrc)

// 输出
draw.output().then(base64data => {
  console.log(base64data)
})
````

## 命令行

````
# 本地运行
yarn serve

# 构建开发环境包
yarn build:dev

# 构建生产环境包
yarn build

# 代码格式检查并自动修复
yarn lint
````
