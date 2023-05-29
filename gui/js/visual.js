// -------------------- GLOBALS -------------------
const StartDate = document.getElementById('start')
const EndDate = document.getElementById('end')
const Reports = document.querySelector('.reports')

// -------------------- EVENTS -------------------
document.querySelector('.gn').addEventListener('click', async function () {
  const data = await GetTimeFrameData(StartDate.value, EndDate.value)
  await GenerateReports(data)
})

// -------------------- FUNCTIONS -------------------
async function GetTimeFrameData (StartDate, EndDate) {
  const response = await fetch(`/data/transactions/${StartDate}/${EndDate}`)
  const data = await response.json()
  return data
}

function PrintLine (canvas, labels, values, name = 'n/a', LineColor = 'rgb(61, 61, 79)') {
  const LineChart = new Chart(canvas, { // eslint-disable-line
    type: 'line',
    data: {
      labels, // ['m','t','w','th','f','s','s'],
      datasets: [{
        label: name,
        data: values, // [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        borderColor: LineColor,
        tension: 0.1
      }]
    }
  })

  return LineChart
}

function PrintPie (canvas, products, quantities, title = 'N/A') {
  let sum = 0
  for (let i = 0; i < quantities.length; ++i) {
    sum += quantities[i]
  }

  const ProductLabelWithPercentage = []
  for (let i = 0; i < products.length; ++i) {
    const LabeWithPercentage = parseFloat(`${quantities[i] / sum * 100}`).toFixed(2)
    ProductLabelWithPercentage.push(
      `${products[i]} ${LabeWithPercentage}%`
    )
  }

  const PieChart = new Chart(canvas, { // eslint-disable-line
    type: 'pie',
    data: {
      labels: ProductLabelWithPercentage,
      datasets: [{
        data: quantities,
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
          'rgb(98, 224, 82)',
          'rgb(230, 115, 230)',
          'rgb(169, 115, 230)',
          'rgb(115, 226, 230)',
          'rgb(66, 160, 47)'
        ],
        hoverOffset: 20
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title
        },
        legend: {
          display: true
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      borderWidth: 0.4
    }
  })

  return PieChart
}

async function GenerateReports (data) {
  Reports.innerHTML = ''

  // Iterate Through Data
  const PieOrganize = {}
  const LineDataValues = {}

  for (let i = 0; i < data.length; ++i) {
    // pie chart data extraction
    if (typeof PieOrganize[data[i].itemname] === 'undefined') {
      PieOrganize[data[i].itemname] = {
        itemname: data[i].itemname,
        price: data[i].price,
        quantity: data[i].quantity
      }
    } else {
      PieOrganize[data[i].itemname].quantity += data[i].quantity
    }

    // line chart data extraction
    if (typeof LineDataValues[formatDateYearMonthDay(data[i].buydate)] === 'undefined') {
      LineDataValues[formatDateYearMonthDay(data[i].buydate)] = {
        totalAmount: data[i].price * data[i].quantity,
        totalQuantity: data[i].quantity
      }
    } else {
      LineDataValues[formatDateYearMonthDay(data[i].buydate)].totalAmount += data[i].price * data[i].quantity
      LineDataValues[formatDateYearMonthDay(data[i].buydate)].totalQuantity += data[i].quantity
    }
  }

  // Calculate Pie Charts Data

  const products = []
  const quantity = []
  const totalAmount = []

  for (const [, value] of Object.entries(PieOrganize)) {
    products.push(value.itemname)
    quantity.push(value.quantity)
    totalAmount.push(value.quantity * value.price)
  }

  // Calculate Line Charts Data

  const DatesBetween = getDates(
    new Date(StartDate.value),
    new Date(EndDate.value)
  )

  const LineAmountParsedValues = []
  const LineQuantityParsedValues = []

  for (let i = 0; i < DatesBetween.length; ++i) {
    if (typeof LineDataValues[DatesBetween[i]] === 'undefined') {
      LineAmountParsedValues.push(0)
      LineQuantityParsedValues.push(0)
    } else {
      LineAmountParsedValues.push(LineDataValues[DatesBetween[i]].totalAmount)
      LineQuantityParsedValues.push(LineDataValues[DatesBetween[i]].totalQuantity)
    }
  }

  // Add to html

  const CanvasQuantity = document.createElement('canvas')
  const CanvasTotals = document.createElement('canvas')
  const CanvasLineDayAmount = document.createElement('canvas')
  const CanvasLineDayQuantity = document.createElement('canvas')

  const PieContainerQuantity = document.createElement('div')
  const PieContainerAmount = document.createElement('div')
  const LineContainerAmount = document.createElement('div')
  const LineContainerQuantity = document.createElement('div')

  const PieTextQuantity = document.createElement('h2')
  const PieTextAmount = document.createElement('h2')
  const LineTextAmount = document.createElement('h2')
  const LineTextQuantity = document.createElement('h2')

  let MinQtySold = quantity[0]
  let MinQtySoldProduct = products[0]
  let MaxQtySold = quantity[0]
  let MaxQtySoldProduct = products[0]

  let MinRevenueSold = totalAmount[0]
  let MinRevenueSoldProduct = products[0]
  let MaxRevenueSold = totalAmount[0]
  let MaxRevenueSoldProduct = products[0]

  for (let i = 0; i < products.length; ++i) {
    if (quantity[i] < MinQtySold) {
      MinQtySold = quantity[i]
      MinQtySoldProduct = products[i]
    }

    if (quantity[i] > MaxQtySold) {
      MaxQtySold = quantity[i]
      MaxQtySoldProduct = products[i]
    }

    if (totalAmount[i] < MinRevenueSold) {
      MinRevenueSold = totalAmount[i]
      MinRevenueSoldProduct = products[i]
    }

    if (totalAmount[i] > MaxRevenueSold) {
      MaxRevenueSold = totalAmount[i]
      MaxRevenueSoldProduct = products[i]
    }
  }

  const SummaryMsg = document.createElement('div')

  PieTextQuantity.innerText = 'Relación de cantidad de artículos vendidos'
  PieTextAmount.innerText = 'Relación de ingresos por artículos vendidos \n'
  LineTextAmount.innerText = 'Total de ingresos diarios'
  LineTextQuantity.innerText = 'Cantidad diaria total'
  SummaryMsg.innerHTML =
    `
    <h1>Unidades vendidas</h2>
    <p>El producto más vendido es <strong> ${MaxQtySoldProduct}   </strong>,
    con una cantidad total <strong> ${MaxQtySold}x ${MaxQtySoldProduct} </strong> durante el periodo de tiempo elegido.</p>
    
    <p>El producto menos vendido es <strong> ${MinQtySoldProduct} </strong>,
    con un total de <strong> ${MinQtySold}x ${MinQtySoldProduct} </strong> vendidos en el periodo de tiempo elegido.</p>
    
    <h1>Ingresos por producto</h2>
    <p>El producto que genero mas ingresos fue <strong> ${MaxRevenueSoldProduct} </strong>, durante el periodo de tiempo elegido
    ${MaxRevenueSoldProduct} genero <strong> ${MaxRevenueSold} </strong>.</p>
    
    <p>El producto que genero menos ingresos fue <strong> ${MinRevenueSoldProduct} </strong>, durante el periodo de tiempo especificado
    <strong> ${MinRevenueSoldProduct} </strong> solo genero <strong> ${MinRevenueSold} </strong>.</p>`

  SummaryMsg.style.display = 'flex'
  SummaryMsg.style.flexDirection = 'column'
  SummaryMsg.style.gap = '0.8em'
  SummaryMsg.style.padding = '1em'

  PieContainerQuantity.appendChild(CanvasQuantity)
  PieContainerAmount.appendChild(CanvasTotals)
  LineContainerAmount.appendChild(CanvasLineDayAmount)
  LineContainerQuantity.appendChild(CanvasLineDayQuantity)

  PrintPie(CanvasQuantity, products, quantity, 'Relación de cantidad vendida')
  PrintPie(CanvasTotals, products, totalAmount, 'Relación de ingresos por ventas')
  PrintLine(CanvasLineDayAmount, DatesBetween, LineAmountParsedValues, 'Ingresos diarios', 'rgb(61, 61, 79)')
  PrintLine(CanvasLineDayQuantity, DatesBetween, LineQuantityParsedValues, 'Cantidad diaria vendida', 'rgb(160, 44, 50)')

  Reports.appendChild(PieTextQuantity)
  Reports.appendChild(PieContainerQuantity)

  Reports.appendChild(PieTextAmount)
  Reports.appendChild(PieContainerAmount)

  Reports.appendChild(LineTextAmount)
  Reports.appendChild(LineContainerAmount)

  Reports.appendChild(LineTextQuantity)
  Reports.appendChild(LineContainerQuantity)

  Reports.appendChild(SummaryMsg)
}

function getDates (start, end) {
  const dates = []
  while (start.getTime() <= end.getTime()) {
    const month = ('0' + (start.getMonth() + 1)).slice(-2)
    const day = ('0' + start.getDate()).slice(-2)
    const date = [start.getFullYear(), month, day].join('-')
    dates.push(date)
    start.setDate(start.getDate() + 1)
  }
  return dates
}

function formatDateYearMonthDay (date) {
  const d = new Date(date)
  const year = d.getFullYear()
  let month = '' + (d.getMonth() + 1)
  let day = '' + d.getDate()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}
