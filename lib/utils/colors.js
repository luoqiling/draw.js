import material from 'material-colors'

const colorMap = [
  'red', 'pink', 'purple', 'deepPurple',
  'indigo', 'blue', 'lightBlue', 'cyan',
  'teal', 'green', 'lightGreen', 'lime',
  'yellow', 'amber', 'orange', 'deepOrange',
  'brown', 'blueGrey', 'black'
]
const colorLevel = ['900', '700', '500', '300', '100']
const colors = []

colorMap.forEach((type) => {
  var typeColor = []
  if (type.toLowerCase() === 'black' || type.toLowerCase() === 'white') {
    typeColor = typeColor.concat(['#000000', '#FFFFFF'])
  } else {
    colorLevel.forEach((level) => {
      const color = material[type][level]
      typeColor.push(color.toUpperCase())
    })
  }
  colors.push(typeColor)
})

export default colors
