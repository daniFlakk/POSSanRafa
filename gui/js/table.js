function RefreshTable (PreviousData, FetchData) {
  if (PreviousData) {
    if (PreviousData.length === FetchData.length) {
      for (let i = 0; i < PreviousData.length; i++) {
        if (
          PreviousData[i].itemname !== FetchData[i].itemname ||
          PreviousData[i].class !== FetchData[i].class ||
          PreviousData[i].quantity !== FetchData[i].quantity ||
          PreviousData[i].price !== FetchData[i].price
        ) {
          return true
        }
      }
      return false
    }
  }
  return true
}

function PrintStats(CostOutput, QuantityOutput, data = null) {
  let CostSum = '0';
  let QuantitySum = '0';

  if (data) {
    CostSum = 0.0;
    QuantitySum = 0;

    for (let i = 0; i < data.length; ++i) {
      CostSum += data[i].price * data[i].quantity;
      QuantitySum += data[i].quantity;
    }

    CostSum = CostSum.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    QuantitySum = `${QuantitySum}`;
  }

  CostOutput.value = CostSum;
  QuantityOutput.value = QuantitySum;
}


class Table {
  constructor (htmlTable, headings, data = null) {
    this.table = htmlTable
    this.thead = this.table.querySelector('thead')
    this.tbody = this.table.querySelector('tbody')

    this.headings = headings
    this.data = data
    this.selection = null
    this.trSelected = null
    this.selectedIndex = null

    // set headings
    for (let i = 0; i < this.headings.length; ++i) {
      const th = document.createElement('th')
      th.textContent = this.headings[i]
      this.thead.appendChild(th)
    }
  }

  fillTable(data, filterMatch = null) {
    this.data = data;
    try {
      // clear
      this.tbody.innerHTML = '';
  
      // populate rows items
      for (let i = 0; i < data.length; ++i) {
        const tr = document.createElement('tr');
  
        for (const element in data[i]) {
          const td = document.createElement('td');
          if (`${element}` === 'price') {
            const formattedPrice = data[i][element].toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            });
            td.textContent = formattedPrice;
          } else if (`${element}` === 'quantity') {
            td.textContent = `${data[i][element]}`;
          } else {
            td.textContent = data[i][element];
          }
          tr.appendChild(td);
        }
  
        if (filterMatch) {
          if (
            data[i].itemname.includes(filterMatch) ||
            data[i].class.includes(filterMatch)
          ) {
            this.tbody.appendChild(tr);
          }
        } else {
          this.tbody.appendChild(tr);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  


  /**
   * Enables the selection of a row in a table.
   * @param {HTMLInputElement} input when specif ied, if  a click even occured
   * the innerText of the first child of the selected <tr> will be displayed
   * in the <input> tag.
   */
  enableSelection (input = null) {
    const trArray = Array.from(this.tbody.children)
    let trPrev
    const itself = this

    for (let i = 0; i < trArray.length; ++i) {
      trArray[i].addEventListener('click', function () {
        try {
          trPrev.style.backgroundColor = ''
          trPrev.style.color = ''
          trPrev.style.outline = ''
        } catch (err) {
          console.log('Initial Selection')
        }

        this.style.backgroundColor = 'rgb(93, 104, 158)'
        this.style.color = 'white'
        this.style.outline = '0.2em solid rgb(11, 40, 186)'

        trPrev = this

        if (input) input.value = trPrev.querySelector('td').innerText

        const rowValues = Array.from(trPrev.children)

        const selected = {
          itemname: rowValues[0].innerText,
          class: rowValues[1].innerText,
          price: rowValues[2].innerText.replaceAll(' ', ''),
          quantity: rowValues[3].innerText.replaceAll(' ', '')
        }

        TableSetSelection(itself, selected, this, i)
      })
    }
  }
}

function TableSetSelection (table, selection, trSelected, i = null) {
  table.selection = selection
  table.trSelected = trSelected
  table.selectedIndex = i
}

function PrintPie (canvas, data) {
  const products = data.map(item => item.itemname)
  const quantities = data.map(item => item.quantity)
  

  const PieChart = new Chart(canvas, { // eslint-disable-line
    type: 'pie',
    data: {
      labels: products,
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
          text: 'Relacion producto cantidad con el inventario',
          color: 'rgb(234, 253, 222)'
        },
        legend: {
          display: false
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      borderWidth: 0.4
    }
  })

  return PieChart
}
export { PrintStats, PrintPie, Table, RefreshTable }
