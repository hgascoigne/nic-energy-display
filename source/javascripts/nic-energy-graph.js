// = require "jquery"
// = require "chartjs"
// = require "moment"
// = require_tree .

$(document).ready(function () {
  // Init
  console.log('Hello :)')

  // Config
  var config = {
  	chartlimit: 8,
  	timeFormat: 'h:mm a'
  }

  var charts = {
  	cw: null,
  	hw: null,
  	kw: null
  }

  // Set API URLs
  var apiEndpoints = {
  	latest: 'http://localhost:8080/data/latest',
  	set: 'http://localhost:8080/data?limit='+config.chartlimit
  }

  // Set update status
  var lastUpdated = moment()
  var timeAgoEl = $('#update-time-ago')
  timeAgoEl.text(lastUpdated.fromNow())

  // Set global defaults
  Chart.defaults.global.responsive = true

  // Set default chart template
  var lineChartOptions = {
    // showScale: false,
    scaleShowGridLines: false,
    // bezierCurve : false,
    datasetStroke: false,
    datasetStrokeWidth: 0,
    pointDot: false
  }

  // Load inital data
  pullDataSet()
  // Set pulling interval
  setInterval(function () {
    pullNewData()
  }, 600000) // 10 Minutes
  // Set status update interval
  setInterval(function () {
    timeAgoEl.text(lastUpdated.fromNow())
  }, 6000) // 1 Minute

  /**
   * Pull new data from the API
   * @return responseObject
   */
  function pullNewData () {
    $.ajax({
      url: apiEndpoints.latest,
      type: 'get',
      dataType: 'json'
    })
      .done(function (data) {
        // Log Update
        console.log('Successfully pulled new data.', data)
        // Change updated timestamp
        lastUpdated = moment()
        // Change status
        $('.footer p').addClass('hidden')
        $('.footer #energy-success-text').removeClass('hidden')
        // Convert Values (From millions to tens)
        var cwBtuValue = (data.cw * 0.00001).toFixed(2)
        var hwBtuValue = (data.hw * 0.00001).toFixed(2)
        var kwDemandValue = data.kw
        // Update chart
        var newLabel = moment().format(config.timeFormat)
        charts.cw.removeData()
        charts.cw.addData([cwBtuValue], newLabel)
        charts.hw.removeData()
        charts.hw.addData([hwBtuValue], newLabel)
        charts.kw.removeData()
        charts.kw.addData([kwDemandValue], newLabel)
        // Update Stats
        $('#cw-btu-value').text(cwBtuValue)
        $('#hw-btu-value').text(hwBtuValue)
        $('#kw-demand-value').text(kwDemandValue)
      })
      .fail(function (error) {
        // Log Update
        console.error('Error pulling new data.', error)
        // Change status
        $('.footer p').addClass('hidden')
        $('.footer #energy-error-text').removeClass('hidden')
      })
  }

  function pullDataSet () {
  	$.ajax({
      url: apiEndpoints.set,
      type: 'get',
      dataType: 'json'
    })
      .done(function (data) {
        // Log Update
        console.log('Successfully pulled new data set.', data)

        // Change updated timestamp
        lastUpdated = moment()

        // Change status
        $('.footer p').addClass('hidden')
        $('.footer #energy-success-text').removeClass('hidden')

        // Create Data
        data.reverse()
        var newDataSet = {
        	cw: [],
        	hw: [],
        	kw: []
        }
        for (var i = 0; i < data.length; i++) {
        	var convertedData = convertData(data[i])
        	newDataSet.cw.push(convertedData.cw)
        	newDataSet.hw.push(convertedData.hw)
        	newDataSet.kw.push(convertedData.kw)
        };

        // Destroy charts
        if(charts.cw !== null)
        	charts.cw.destroy()
        if(charts.hw !== null)
        	charts.hw.destroy()
        if(charts.kw !== null)
        	charts.kw.destroy()

        // Recreate charts
			  createNewCharts(newDataSet)

        // Update Stats
        $('#cw-btu-value').text(newDataSet.cw[newDataSet.cw.length-1])
        $('#hw-btu-value').text(newDataSet.hw[newDataSet.hw.length-1])
        $('#kw-demand-value').text(newDataSet.kw[newDataSet.kw.length-1])
      })
      .fail(function (error) {
        // Log Update
        console.error('Error pulling new data.', error)
        // Change status
        $('.footer p').addClass('hidden')
        $('.footer #energy-error-text').removeClass('hidden')
      })
  }

  /**
   * Converts from millions to tens
   * @param  object dataPoint Initial data point
   * @return object           Converted data
   */
  function convertData (dataPoint) {
  	var newData = {}
  	newData.cw = (dataPoint.cw * 0.00001).toFixed(2)
    newData.hw = (dataPoint.hw * 0.00001).toFixed(2)
    newData.kw = dataPoint.kw.toFixed(1)

  	return newData
  }

  function createNewCharts (data) {
  	var chartLabels = []
	  var tempData = []
	  for (var i = 0; i < config.chartlimit; i++) {
	  	chartLabels.push(moment().subtract(10*i, 'minutes').format(config.timeFormat))
	  	tempData.push(0)
	  }
	  chartLabels.reverse()
	  console.log(chartLabels)

	  var usageTemplateCW = {
	    labels: chartLabels,
	    datasets: [
	      {
	        label: 'Chilled Water BTU',
	        fillColor: '#52C5E5',
	        data: data.cw
	      }
	    ]
	  }

	  var usageTemplateHW = {
	    labels: chartLabels,
	    datasets: [
	      {
	        label: 'Hot Water BTU',
	        fillColor: '#D92F2F',
	        data: data.hw
	      }
	    ]
	  }

	  var usageTemplateKW = {
	    labels: chartLabels,
	    datasets: [
	      {
	        label: 'KW Demand',
	        fillColor: '#E3831A',
	        data: data.kw
	      }
	    ]
	  }

	   // Cold Wlater BTU
	  var cwBtuDomEl = $('#cw-btu-chart').get(0).getContext('2d')
	  charts.cw = new Chart(cwBtuDomEl).Line(usageTemplateCW, lineChartOptions)
	  // Hot Water BTU
	  var hwBtuDomEl = $('#hw-btu-chart').get(0).getContext('2d')
	  charts.hw = new Chart(hwBtuDomEl).Line(usageTemplateHW, lineChartOptions)
	  // kW
	  var kwDemandDomEl = $('#kw-demand-chart').get(0).getContext('2d')
	  charts.kw = new Chart(kwDemandDomEl).Line(usageTemplateKW, lineChartOptions)
  }

  function clearCharts () {
  }
})
