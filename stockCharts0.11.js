/*
 *  filename: stockCharts0.11.js
 *  author: HP4k1h5
 *  date: 2018 02 22 
 *  purpose: to display stock charts in the terminal
 * */

// handle command line arguments
let startTime = Date.now()
const argv = require('yargs').argv
let yargTime = Date.now()
console.log( "yargTime ",yargTime-startTime )

const sym = (argv.s).toUpperCase()
const intv = (argv.i == null ? 15 : argv.i)
// chart size disabled for now
//const size = (argv.z == null ? 'm' : argv.z)

const api_key = require('./api_key.js')
let apiTime = Date.now()
console.log( "apiTime ",apiTime-startTime )
// url builder 
const  https = require('https')
const  url = 'https://www.alphavantage.co/query?function=' 
              + (/^m$/i.test(intv) 
              ? `TIME_SERIES_MONTHLY&symbol=${sym}`
              : `TIME_SERIES_INTRADAY&symbol=${sym}&interval=${intv}min`) 
              + `&apikey=${api_key}`

let graph_width = 65
let graph_height = 25

https.get(url, resp => {
  // https response error handling
  if (resp.statusCode !== 200){
    console.log(`http response error...\n status code: ${resp.statusCode}`)
    process.exit()
  }

      let getTime = Date.now()
      console.log( "get time ",getTime-startTime )
  let data = ''
  resp.on('data', (datum) => {
    data += datum
      getTime = Date.now()
      console.log( "get time ",getTime-startTime )
  })
  resp.on('end', () => {
    let symbol,
        refresh,
        interval, 
        intKey, 
        priceData 

    try{
      data = JSON.parse(data)
      symbol = data['Meta Data']['2. Symbol']
      refresh = data['Meta Data']['3. Last Refreshed']
      interval =  data['Meta Data']['4. Interval'] || null
      intKey = (interval !== null ? `Time Series (${interval})`
                                  : 'Monthly Time Series')
      priceData = data[intKey]
      console.log('sym:\tint:\n', (symbol + '\t'), intKey)

    } catch(error) {
      console.log( 'err: ', error)
      console.log( 'data: ', data)
    }

    // get min/max/time from time series 
    let low,
        high,
        prices = [], 
        openPrices = [],
        first = Infinity,
        unixTime

    for (let t in priceData){
      // get first date in series
      unixTime = Date.parse(t)
      if (unixTime < first){
        first = unixTime
      }
      let oPD = +priceData[t]['1. open']
      let pD = +priceData[t]['4. close']
      prices.push(pD)
      openPrices.push(oPD)
      if (pD < low){
        low = pD
      }
      if (pD > high){
        high = pD
      }
    }

    // normalize values to chart size
    let zeroVals = prices.map(p => p-low)
    let eqHigh = Math.max(...zeroVals)
    let valEq = graph_height / eqHigh
    zeroVals = zeroVals.map(zV => zV * valEq)

    let d = new Date(first)
    let formTime = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`
    console.log(formTime + ' to ' + refresh)
    console.log(`L:${low} :: H:${high}`)
    
    let avgs = [],
        zVLen = zeroVals.length,
        lenEq = Math.ceil(zVLen / graph_width),
        modLen = (zVLen%lenEq === 0 
                                  ? zVLen
                                  : zVLen-(zVLen%lenEq))

    for (let p=0; p<modLen; p+=lenEq){
      avgs.push( zeroVals.slice(p,p+lenEq).reduce((a,v) => a+v)/lenEq)
    }
    avgs.push(zeroVals.slice(zVLen-(zVLen%lenEq), zVLen))

    // GRAPHING FUNCTION
    let chart = []
    let y = graph_height 
    while (y>0){
      let row =[]
      for (let x = avgs.length-1; x>0; x--){
        if (avgs[x]>=y){
          row.push('o')
        }
        else{
          row.push('.')
        }
      }
      chart.push(row)
      y--
    }
    chart.forEach(r => console.log( r.join('')))
      let chartTime = Date.now()
      console.log( "chart time ",chartTime-startTime )
  })

}).on('error', (err) => {
  console.error(err)

})
/*
*/
