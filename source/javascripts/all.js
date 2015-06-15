//= require "jquery"
//= require "chartjs"
//= require "moment"
//= require_tree .

$(document).ready(function() {
	//Init
	console.log('Hello :)');
	var lastUpdated = moment();
	var timeAgoEl = $('#update-time-ago');
	timeAgoEl.text(lastUpdated.fromNow());
	//Set global defaults
	Chart.defaults.global.responsive = true;
	//Set default chart template
	var lineChartOptions = {
		//showScale: false,
		scaleShowGridLines : false,
		//bezierCurve : false,
		datasetStroke : false,
		datasetStrokeWidth : 0,
		pointDot : false
	};

	var usageTemplateCW = {
	    labels: ["", "", "", "", "", "", ""],
	    datasets: [
	        {
	            label: "Chilled Water BTU",
	            fillColor: "#52C5E5",
	            data: [52.2, 52.25, 54, 53.8, 53.3, 51.7, 52.3]
	        }
	    ]
	};

	var usageTemplateHW = {
	    labels: ["", "", "", "", "", "", ""],
	    datasets: [
	        {
	            label: "Hot Water BTU",
	            fillColor: "#D92F2F",
	            data: [6.2, 6.3, 6.2, 6.2, 6.4, 6.1, 6.0]
	        }
	    ]
	};

	var usageTemplateKW = {
	    labels: ["", "", "", "", "", "", ""],
	    datasets: [
	        {
	            label: "KW Demand",
	            fillColor: "#E3831A",
	            data: [3.2, 3.35, 3.6, 4.8, 4.3, 3.3, 3.5]
	        }
	    ]
	};

	//Load inital data
	pullNewData();
	//Set pulling interval
	setInterval(function() {
		pullNewData();
	}, 600000); //10 Minutes
	//Set status update interval
	setInterval(function() {
		timeAgoEl.text(lastUpdated.fromNow());
	}, 6000); //1 Minute

	//TEMP: Create new chart
	//Cold Wlater BTU
	var cwBtuDomEl = $("#cw-btu-chart").get(0).getContext("2d");
	var cwBtuChart = new Chart(cwBtuDomEl).Line(usageTemplateCW, lineChartOptions);
	//Hot Water BTU
	var hwBtuDomEl = $("#hw-btu-chart").get(0).getContext("2d");
	var hwBtuChart = new Chart(hwBtuDomEl).Line(usageTemplateHW, lineChartOptions);
	//kW
	var kwDemandDomEl = $("#kw-demand-chart").get(0).getContext("2d");
	var kwDemandChart = new Chart(kwDemandDomEl).Line(usageTemplateKW, lineChartOptions);

	/**
	 * Pull new data from the API
	 * @return responseObject
	 */
	function pullNewData() {
		$.ajax({
			url: 'http://40.135.11.106:8088/pe/bmsdata',
			type: 'get',
			dataType: 'xml'
		})
		.done(function(data) {
			//Log Update
			console.log("Successfully pulled new data.", data);
			//Change updated timestamp
			lastUpdated = moment();
			//Change status
			$('.footer p').addClass('hidden');
			$('.footer #energy-success-text').removeClass('hidden');
			//Convert Values (From millions to tens)
			var cwBtuValue 		= (data.record.Unit1ChilledWaterBtu*0.00001);
			var hwBtuValue 		= (data.record.Unit1HotWaterBtu*0.00001);
			var kwDemandValue 	= data.record.Unit1kWDemand;
			//Update chart
			cwBtuChart.removeData();
			cwBtuChart.addData([cwBtuValue], "");
			hwBtuChart.removeData();
			hwBtuChart.addData([hwBtuValue], "");
			kwDemandChart.removeData();
			kwDemandChart.addData([kwDemandValue], "");
			//Update Stats
			$('#cw-btu-value').text(cwBtuValue);
			$('#hw-btu-value').text(hwBtuValue);
			$('#kw-demand-value').text(kwDemandValue);
		})
		.fail(function(error) {
			//Log Update
			console.error("Error pulling new data.", error);
			//Change status
			$('.footer p').addClass('hidden');
			$('.footer #energy-error-text').removeClass('hidden');
		})
	};
});