import { Table, RefreshTable } from './table.js'

const InValSelectedItem = document.getElementById('selected-item')
const InValSelectedQuantity = document.getElementById('selected-quantity')
const InValFilter = document.getElementById('filter')

const InValTotalPrice = document.getElementById('total-price')
const InValPayment = document.getElementById('payment')
const InValChange = document.getElementById('change')

const InventoryTable = new Table(document.getElementById('inventory'), ['Productos', 'Clase', 'Precio', 'Cantidad'])
const BuyTable = new Table(document.getElementById('chosen'), [])

let CanBeSaved = false
let filterMatch = null

async function LoadInventory () {
  const response = await fetch('/data/inventory')
  const data = await response.json()

  if (RefreshTable(InventoryTable.data, data)) {
    InventoryTable.fillTable(data, filterMatch)
    InventoryTable.enableSelection(InValSelectedItem)
  }
}

LoadInventory()
setInterval(LoadInventory, 1600)

function ResetPanelA () {
  filterMatch = null

  InventoryTable.fillTable(InventoryTable.data, filterMatch)
  InventoryTable.enableSelection(InValSelectedItem)
  InventoryTable.trSelected = null

  InValFilter.value = ''
  InValSelectedItem.value = 'None'
  InValSelectedQuantity.value = 0
}

function ResetPanelB () {
  BuyTable.fillTable(BuyTable.data)
  BuyTable.enableSelection()
  BuyTable.trSelected = null

  let CurrentTotal = 0
  for (let i = 0; i < BuyTable.data.length; ++i) {
    CurrentTotal += BuyTable.data[i].price * BuyTable.data[i].quantity
  }

  InValTotalPrice.value = `${CurrentTotal}`
  InValPayment.value = '0'
  InValChange.value = '0'

  CanBeSaved = false
}

// Filter Items
let Filter = null
document.getElementById('filter').addEventListener('input', () => {
  if (Filter) {
    clearTimeout(Filter)
  }
  Filter = setTimeout(() => {
    filterMatch = InValFilter.value
    if (filterMatch === '') {
      filterMatch = null
    }
    InventoryTable.fillTable(InventoryTable.data, filterMatch)
    InventoryTable.enableSelection(InValSelectedItem)
  }, 600)
})

// Buying an Item
document.querySelector('.abtn').addEventListener('click', async () => {
  if (!InventoryTable.trSelected) {
    window.alert('Primero selecione un articulo de la lista')
  } else if (
    InValSelectedQuantity.value === '0' ||
    InValSelectedQuantity.value === '') {
    window.alert('Ingrese una cantidad primero')
  } else {
    // Add Item Action
    let FilteredData = InventoryTable.data
    if (filterMatch) {
      FilteredData = FilteredData.filter((eobj) => {
        return eobj.itemname.includes(filterMatch) || eobj.class.includes(filterMatch)
      })
    }

    const quantity = InValSelectedQuantity.value
    const DeductedQuantity = FilteredData[InventoryTable.selectedIndex].quantity - quantity

    if (DeductedQuantity < 0) {
      window.alert('No hay cantidad suficiente')
    } else {
      FilteredData[InventoryTable.selectedIndex].quantity = DeductedQuantity
      BuyTable.data.push({
        itemname: FilteredData[InventoryTable.selectedIndex].itemname,
        class: FilteredData[InventoryTable.selectedIndex].class,
        price: FilteredData[InventoryTable.selectedIndex].price,
        quantity
      })

      try {
        // subtract quantity to the database
        const response = await fetch(`/data/inventory/sub-qty/${FilteredData[InventoryTable.selectedIndex].itemname.replaceAll(' ', '&+')}`, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'put',
          body: JSON.stringify({ quantity })
        })

        const data = await response.json()

        console.log('Transaction Quantity Subtracted', data)

        // rerender tables
        ResetPanelA()
//        ResetPanelB()
      } catch (error) {
        console.error('ERROR in : transaction>subtract item quantity>fetch()\n', error)
      }
    }
  }
})

// Removing an Item
// document.querySelector('.rbtn').addEventListener('click', async () => {
//   if (!BuyTable.trSelected) {
//     window.alert('Primero selecione un articulo de la lista para eliminarlo de la venta')
//   } else {
//     try {
//       // Re-Add the quantity in the database
//       const response = await fetch(`/data/inventory/add-qty/${BuyTable.data[BuyTable.selectedIndex].itemname.replaceAll(' ', '&+')}`, {
//         headers: {
//           Accept: 'application/json',
//           'Content-Type': 'application/json'
//         },
//         method: 'put',
//         body: JSON.stringify({
//           quantity: BuyTable.data[BuyTable.selectedIndex].quantity
//         })
//       })

//       const data = await response.json()
//       console.log('Transaction Quantity Readded', data)

//       // rerender tables
//       ResetPanelA()
//       BuyTable.data.splice(BuyTable.selectedIndex, 1)
//       ResetPanelB()
//     } catch (error) {
//       console.error('ERROR in : transaction>re-add item quantity>fetch()\n', error)
//     }
//   }
// })

// // Calculate Change
// document.querySelector('.cbtn').addEventListener('click', () => {
//   let CurrentTotal = 0
//   for (let i = 0; i < BuyTable.data.length; ++i) {
//     CurrentTotal += BuyTable.data[i].price * BuyTable.data[i].quantity
//   }

//   // convert payment
//   const Payment = InValPayment.value

//   if (BuyTable.data.length < 1) {
//     window.alert('No hay un valor de venta : primero agregue un articulo a la venta')
//   } else if (
//     InValPayment.value === '0.0' ||
//     InValPayment.value === '0' ||
//     InValPayment.value === ''
//   ) {
//     window.alert('No hay valor de pago por favor indique con cuanto desean pagar')
//   } else if (CurrentTotal > Payment) {
//     window.alert('El valor con el que desean pagar es insuficiente')
//   } else {
//     // Calculate Change Action
//     const ChangeAmount = Payment - CurrentTotal
//     InValChange.value = `${ChangeAmount}`
//     CanBeSaved = true
//   }
// })

// Save Transactions
document.querySelector('.abtn').addEventListener('click', async () => {
  if (BuyTable.data.length <= 0) {
    window.alert('No hay productos en la lista de venta')
  // } else if (!CanBeSaved) {
  //   window.alert('Calcule el cambio primero')
  } else {
    const SaveDate = new Date().toISOString()

    try {
      const response = await fetch(`/data/transactions/${SaveDate}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'post',
        body: JSON.stringify(BuyTable.data)
      })

      const data = await response.json()
      console.log(data)
      BuyTable.data = []
      ResetPanelA()
 //     ResetPanelB()
    } catch (error) {
      console.error(error)
    }
  }
})

BuyTable.data = []

// mobile buttons
const TableContainer1 = document.querySelector('.invtbl')
const TableContainer2 = document.querySelector('.buy-table')
const Panel1 = document.querySelector('.panel1')
const Panel2 = document.querySelector('.panel2')

document.querySelector('.nbtn').addEventListener('click', function () {
  TableContainer1.style.display = 'none'
  TableContainer2.style.display = 'block'
  Panel1.style.display = 'none'
  Panel2.style.display = 'flex'
})

document.querySelector('.pbtn').addEventListener('click', function () {
  TableContainer1.style.display = 'block'
  TableContainer2.style.display = 'none'
  Panel1.style.display = 'flex'
  Panel2.style.display = 'none'
})
