var fm = require('./fm');
var throttle = require('./throttle');
var features = require('./detectFeatures')();

qz_blue_1 = "#51b2e5";
qz_blue_2 = "#168dd9";
qz_blue_3 = "#00609f";
qz_blue_4 = "#154866";

//Purples
qz_purp_1 = "#d190b6";
qz_purp_2 = "#d365ba";
qz_purp_3 = "#ab5787";
qz_purp_4 = "#703c5c";


// Grays
qz_gray_1 = "#c4c4c4";
qz_gray_2 = "#969696";
qz_gray_3 = "#666666";

//Other colors
qz_ora_1 = "#E5A451";
qz_ora_2 = "#9F5C00";

qz_gre_1 = "#94D365";
qz_gre_2 = "#3C703C";

color_progression = [qz_purp_3,qz_blue_1,qz_purp_4,qz_blue_2,qz_purp_1,qz_blue_3,qz_purp_2,qz_blue_1] //,qz_gray_1, qz_gray_3, qz_gray_2]

// CONFIG
var config = { 
	years: d3.range(1961,2014), // maximum value not included, so produces range 1961-2013
	timelineSpeed : 800, // after 0.8 seconds, next year appears
	color : d3.scale.threshold() // define steps for color changes in map
			.domain([40,45,48,49,49.5,50.5,51,52,55,60])
			//.range(["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#e5f5e0", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d", "#8e0152"]), // blue, pink, green
			//.range(["#003c30", "#01665e", "#35978f", "#80cdc1", "#c7eae5", "#d1e5f0", "#f6e8c3", "#dfc27d", "#bf812d", "#8c510a", "#543005"]), // green, blue, brown
			.range(["#003c30", "#01665e", "#35978f", "#80cdc1", "#c7eae5", "#d1e5f0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"]), // green, blue, red
			// .range([qz_blue_4, qz_blue_3, qz_blue_2, qz_blue_1, "#000", qz_gray_1, qz_purp_1, qz_purp_2, qz_purp_3, qz_purp_4]),
	countryGroups: { // predefine country groups for linecharts, use ISO 999 to add world average
		"indiachina": [356,156,586,50,999], // India, China, Pakistan, Bangladesh, World
		"arab": [999,682,48,512,784,634,414], //Saudi Arabia, Bahrain, Oman, United Arab Emirates, Qatar, Kuwait
		"soviet": [643,804,112,233,428], // Russian Federation, Ukraine, Belarus, Estonia, Latvia
		"warridden": [646,368,116], // Rwanda, Iraq, Cambodia
		"highincome": [997,578,36,756], // High Income, World, Norway, Australia, Switzerland	
		"brics": [76,643,356,156,710], // Brazil, Russia, India, China, South Africa
		"northamerica" : [840, 124, 484, 999], // USA, Canada, Mexico, World
		"mostrising": [344,144,524], //Hong Kong, Sri Lanka, Nepal
		"africa": [894,404,562,434], //Zambia, Kenya, Niger, Libya
		"centraleurope": [756,276,250,380,40,999] // Switzerland, Germany, France, Italy, Austria, World	
		}
	} 

// STATE
// store all input parameters for the visualisation in state so that we always know what state the visualisation is in

var state = {
	mapwidth : $("#map").width(), // .node().offsetWidth reads width of element #map, needed for responsive positioning
	active : null,
	currentYear:d3.max(config.years), 
	countries: [],
	aggregates: [],
	total: {},
	world: null,
	timeline: "ready",
	userselected: parent.window.location.hash ? parent.window.location.hash.substring(2,parent.window.location.hash.length-1).split(",").map(Number) : [392, 120, 999] // user either ids in URL or preset to japan, cameroon and world
};

console.log("Selected countries by user: " + state.userselected);

// ACTIONS

var actions = {
	updateSizes : function() { 
		state.mapwidth = $("#map").width();
		render();
	},
	updateYear : function(year) {
		state.currentYear = +year; // + turns strings into numbers
		renderMap();
		renderDatatext();
		actions.updateMapyear();
	},
	updateData : function(rows) {
		state.countries = _.where(rows, {entity: "country"});
		state.aggregates = _.where(rows, {entity: "aggregate"});
		state.total = _.findWhere(rows, {name: "World average"});
		render();
	},
	toggleTimeline : function () {

		if (state.timeline == "ready") {
			state.timeline = "playing";
			console.log("timeline " + state.timeline);
			state.currentYear = d3.min(config.years);
			actions.playTimeline();
		}

		else if (state.timeline == "playing") {
			state.timeline = "paused";
			clearInterval(state.timelineInterval);
			state.timelineInterval = null;
			console.log("timeline " + state.timeline);
			d3.select('.play').html('<img src="assets/play.png" alt="Resume animation" title="Resume animation"/>');
			return;
		}

		else if (state.timeline == "paused") {
			state.timeline = "playing";
			console.log("timeline " + state.timeline);
			actions.playTimeline();
		}
	},
	playTimeline : function() {
		
		d3.select('.play').html('<img src="assets/pause.png" alt="Pause animation" title="Pause animation"/>');
		
		state.timelineInterval = setInterval(function(){
			
			if (state.currentYear == d3.max(config.years)) {
				d3.select('.play').html('<img src="assets/replay.png" alt="Replay animation" title="Replay animation"/>');
				clearInterval(state.timelineInterval);
				state.timeline = "ready";
			}

			if (state.timeline == "playing") {
				actions.updateYear(state.currentYear+1);
				console.log("Visualising data from " + state.currentYear);
			}

			else return;
		},config.timelineSpeed)
	},
	updateUserinput : function() {
		state.userselected[0] = d3.select(".userinput-0").node().value; 
		state.userselected[1] = d3.select(".userinput-1").node().value;
		parent.window.location.hash = "[" + state.userselected + "]";
		renderLinechart(".chart-usergenerated",state.userselected,"normal");
	},
	updateMapyear : function() {
		d3.select(".mapyear").text(state.currentYear);
	}
}

var help = {
	exactTicks: function(extent,numTicks) {
		var t = []
		numTicks = numTicks - 1
		t.push(extent[0])
		range = extent[1] - extent[0]
		for (var i = 1; i < numTicks; i++) {
			t.push(extent[0] + (range / numTicks * i))
		};
		t.push(extent[1])
		return t
	},
	country_to_qz_style: function(s) {
		var correx = {
				"United States": "US",
				"United Kingdom": "UK"
			}
		return correx.hasOwnProperty(s) ? correx[s] : s
	}
};

// RENDERING
// make one render() function and call all functions to render sub-elements within

function render() {  	
	// renderMenu(); // dropdown menu to let user switch between years manually
	renderDatatext();
	if (state.world && state.countries.length > 0) renderMap();
	renderKey(); // map legend
	renderMapyear();
	renderLinechart(".chart-1", config.countryGroups.indiachina, "normal"); // params: where, data, size
	renderLinechart(".chart-2", config.countryGroups.arab, "large");
	renderLinechart(".chart-3", config.countryGroups.soviet, "normal");
	renderLinechart(".chart-4", config.countryGroups.warridden, "normal");
	renderLinechart(".chart-5", config.countryGroups.highincome, "normal");
	renderLinechart(".chart-6", config.countryGroups.brics, "normal");
	renderLinechart(".chart-7", config.countryGroups.northamerica, "normal");
	renderLinechart(".chart-8", config.countryGroups.mostrising,"normal");
	renderLinechart(".chart-9", config.countryGroups.africa,"normal");
	renderLinechart(".chart-usergenerated", state.userselected,"normal");
	renderUserinput();
} 

// RENDERING FUNCTIONS

function renderMenu() {

	var menu = d3.select('#menu').selectAll('select').data([0]);

	menu.enter()
		.append('select');

	var options = menu.selectAll('option')
		.data(config.years);
	
	options.enter()
		.append('option');

	options
		.text(function(d) {return d}) // go through all d in data and append an option with value d to the select
		.attr('selected',function(d) {return d === state.currentYear ? 'selected' : null}); 

	options.exit()
		.remove();

	menu.on('change', function(d) {
		actions.updateYear(this.value);
	})
}

function renderDatatext() {
	d3.select('.currentYear').text(state.currentYear);
	d3.select('.currentTotalPercentage').text(d3.round(state.total[state.currentYear],2));

	var sexcount = _.countBy(state.countries, function(country) {
		if (country[state.currentYear]) {
			if (country[state.currentYear] > 50.5) {return 'female'}
			else if (country[state.currentYear] < 49.5) {return 'male'}
			else {return 'even'}
		}

		else {return 'nodata'}
	});

	d3.select('.currentMaleCountries').text(sexcount['male']);
	d3.select('.currentFemaleCountries').text(sexcount['female']);
	d3.select('.currentEvenCountries').text(sexcount['even']);
	d3.select('.currentNoDataCountries').text(sexcount['nodata']);
}

function renderMap() {

	var width = state.mapwidth,
	height = width;

	var projection = d3.geo.azimuthalEqualArea()
		.clipAngle(180 - 1e-3)
		.scale(237 / 960 * width)
		.translate([width / 2, height / 2])
		.precision(.1);

	// an alternative projection
	// var projection = d3.geo.orthographic()
	//	 .scale(475)
	//	 .translate([width / 2, height / 2])
	//	 .clipAngle(90)
	//	 .precision(.1);

	var path = d3.geo.path()
		.projection(projection);

	var graticule = d3.geo.graticule();

	var map = d3.select("#map");

	var svg = map.selectAll('svg').data([0]);

	var svgEnter = svg.enter()
		.append("svg")

	svgEnter.append("defs").append("path")
		.datum({type: "Sphere"})
		.attr("id", "sphere")
		
	d3.select("#sphere").attr("d", path);

	//circle around the globe
	svgEnter.append("use")
		.attr("class", "stroke")
		.attr("xlink:href", "#sphere");

	svgEnter.append("use")
		.attr("class", "fill")
		.attr("xlink:href", "#sphere");

	var graticule = svgEnter.append("path")
		.datum(graticule)
		.attr("class", "graticule")
	  
	  d3.selectAll("path.graticule").attr("d", path);

	svg.attr("width", width)
		.attr("height", height);

	var countries = svg.selectAll('.country').data(topojson.feature(state.world, state.world.objects.countries).features);

	countries.enter()
		.insert("path", ".graticule")
		.attr("class", "country")
		.attr("title", function(d) { return d.name;})
		.attr("id", function(d) { return "country-" + d.id;})
		
	countries.attr("d", path);

	svgEnter.insert("path", ".graticule")
	  .datum(topojson.mesh(state.world, state.world.objects.countries, function(a, b) { return a !== b; }))
	  .attr("class", "boundary")
	  
	 d3.selectAll("path.boundary").attr("d", path);

	var tip = d3.tip()
	  .attr('class', 'd3-tip')
	  .offset([5, 0])
	  .html(function(d) {
		var countryData = _.findWhere(state.countries, {id: +d.id});
		if (countryData) {
			if (!isNaN(countryData[state.currentYear])) { // check if actual value exists
				return countryData.name + ": " + d3.round(countryData[state.currentYear],2) + "% women";
			}
			else {return countryData.name + ": no data available";}
		}
		return 'no data available'; 
	  });

	d3.selectAll('.d3-tip').remove();
	svg.call(tip);

	countries
		.style({'fill': function(d) {
			var countryData = _.findWhere(state.countries, {id: +d.id}); // underscore method to find an object in an array based on property id
			if (countryData) {
				return config.color(countryData[state.currentYear]); // colour countries
			}
			return '#f0f0f0'; // grey for countries without any data
		}
		})
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide);
}

function renderKey() {

	var x = d3.scale.linear()
	.domain([38, 62]) // range of values to be included in the legend
	.range([0, 300]); // defines length of legend

	var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom")
	.tickSize(0)
	.tickFormat(function(d){return d == 40 ? "40%" : d})
	.tickValues([40,45,48,49,51,52,55,60]); // left out two middle values for space, to generate tick values dynamically: config.color.domain()

	var svg = d3.select("#map").selectAll('svg');

	var g = svg.selectAll('g').data([0]);

	var gEnter = g.enter()
		.append("g")
		.attr("class", "key")
	  
	 g.attr("transform", "translate(" + (state.mapwidth-300)/2 + ",30)"); // position within the svg space

	gEnter.selectAll("rect")
		.data(config.color.range().map(function(d, i) {
		  return {
			x0: i ? x(config.color.domain()[i - 1]) : x.range()[0],
			x1: i < config.color.domain().length ? x(config.color.domain()[i]) : x.range()[1],
			z: d
		  };
		}))
	  .enter().append("rect")
		

	g.selectAll("rect").attr("height", 10)
		.attr("x", function(d) { return d.x0; })
		.attr("width", function(d) { return d.x1 - d.x0; })
		.style("fill", function(d) { return d.z; });
		// .attr("x", function(d,i) { return i*(x.range()[1]/ config.color.domain().length) }) // alternative with all rects same size
		// .attr("width", x.range()[1]/ config.color.domain().length)

	gEnter.call(xAxis).append("text")
		.attr("class", "caption")
		.attr("dy", "-0.5em")
		.text("Percentage of women in population");
}

function renderLinechart(selector, countries, size) {

	// manual label position corrections
	var labelPositioning = {
		'.chart-1': {
		// "indiachina": [
			356:{ //India
				"dy":1,
				"x":1970,
				"anchor":"end"
			},
			156:{ //China
				"dy":1,
				"x":2013,
				"anchor":"end"
			},
			586:{ //Pakistan
				"dy":1,
				"x":1961,
				"anchor":"start"
			},
			50:{ //Banladesh
				"dy":-0.3,
				"x":2008,
				"anchor":"end"
			},
			999:{ //world
				"dy":-0.4,
				"x":2013,
				"anchor":"end"
			}

		},
		'.chart-2': {
		// "arab": [
			682:{ //Saudi
				"dy":-0.3,
				"x":2000,
				"anchor":"middle"
			},
			48:{ // Bahrain
				"dy":1,
				"x":2007,
				"anchor":"end"
			},
			512:{ // Oman
				"dy":0.8,
				"x":2013,
				"anchor":"end"
			},
			784:{ //UAE
				"dy":-0.3,
				"x":2013,
				"anchor":"end"
			},
			634:{ //Qatar
				"dy":0.8,
				"x":2013,
				"anchor":"end"
			},
			414:{ //Kuwait
				"dy":1,
				"x":1968,
				"anchor":"start"
			},
			999:{ //world
				"dy":-0.3,
				"x":2013,
				"anchor":"end"
			}
			// ], //Saudi Arabia, Bahrain, Oman, United Arab Emirates, Qatar, Kuwait

		},
		'.chart-3': {
		// "soviet": [
			643:{ //Russia
				"dy":-0.4,
				"x":1995,
				"anchor":"middle"
			},
			804:{ // Ukraine
				"dy":-0.2,
				"x":1975,
				"anchor":"start"
			},
			112:{ //Belarus
				"dy":1,
				"x":2005,
				"anchor":"start"
			},
			233:{ //Estonia
				"dy":-0.3,
				"x":1964,
				"anchor":"start"
			},
			428:{ //Latvia
				"dy":-0.4,
				"x":2013,
				"anchor":"end"
			}
			// ], // Russian Federation, Ukraine, Belarus, Estonia, Latvia


		},
		'.chart-4': {
		// "warridden": [
			646:{ //Rwanda
				"dy":1,
				"x":1985,
				"anchor":"end"
			},
			368:{ //Iraq
				"dy":1.1,
				"x":2013,
				"anchor":"end"
			},
			116:{ //Cambodia
				"dy":-0.7,
				"x":2013,
				"anchor":"end"
			}
			// ], // Rwanda, Iraq, Cambodia


		},
		'.chart-5': {
		// "highincome": [
			578:{ //Norway
				"dy":-0.4,
				"x":1990,
				"anchor":"middle"
			},
			36:{ // Australia
				"dy":1,
				"x":1975,
				"anchor":"start"
			},
			756:{ // Switzerland
				"dy":1,
				"x":1970,
				"anchor":"middle"
			},
			997:{ //High Income
				"dy":-0.3,
				"x":1980,
				"anchor":"middle"
			}
			// ], // High Income, World, Norway, Australia, Switzerland	


		},
		'.chart-6': {
		// "brics": [
			76:{ //Brazil
				"dy":1.2,
				"x":2013,
				"anchor":"end"
			},
			643:{ //Russia
				"dy":-0.3,
				"x":2013,
				"anchor":"end"
			},
			356:{ // India
				"dy":-0.3,
				"x":2013,
				"anchor":"end"
			},
			156:{ //China
				"dy":-0.3,
				"x":1965,
				"anchor":"start"
			},
			710:{ //South Africa
				"dy":-0.3,
				"x":2013,
				"anchor":"end"
			}
			// ], // Brazil, Russia, India, China, South Africa

					
		}
		,
		'.chart-7': {
		// "northamerica" : [
			840:{ //USA
				"dy":-0.3,
				"x":2013,
				"anchor":"end"
			},
			124:{ // Canada
				"dy":1,
				"x":2013,
				"anchor":"end"
			},
			484:{ //Mexico
				"dy":-0.2,
				"x":2005,
				"anchor":"middle"
			},
			999:{ //World
				"dy":1,
				"x":2013,
				"anchor":"end"
			}
			// ], // USA, Canada, Mexico, World

				
		},
		'.chart-8': {
		// "mostrising": [
			344:{ // HK
				"dy":-0.4,
				"x":2013,
				"anchor":"end"
			},
			144:{ //Sri Lanka
				"dy":1,
				"x":1961,
				"anchor":"start"
			},
			524:{ //Nepal
				"dy":-0.3,
				"x":2013,
				"anchor":"end"
			}
			// ], //Hong Kong, Sri Lanka, Nepal


		},
		'.chart-9': {
		// "africa": [
			894:{ //Zambia
				"dy":-0.3,
				"x":1961,
				"anchor":"start"
			},
			404:{ //Kenya
				"dy":1,
				"x":1961,
				"anchor":"start"
			},
			562:{ //Niger
				"dy":-0.4,
				"x":1990,
				"anchor":"middle"
			},
			434:{ //Libya
				"dy":1,
				"x":1961,
				"anchor":"start"
			}
			// ], //Zambia, Uganda, Kenya, Niger, Libya

				
		},
		'.chart-usergenerated': {

		}
	}

	var pxFontSize = Number(getComputedStyle(document.getElementsByTagName("section")[3], "").fontSize.match(/(\d*(\.\d*)?)px/)[1]);
	var size_ratio = pxFontSize/20

	var margin = {top: 20*size_ratio, right: 20*size_ratio, bottom: 20*size_ratio, left: 40*size_ratio};
	var width = $(selector).width() - margin.left - margin.right,
		height = size == "normal" ? $(selector).width()/2 - margin.top - margin.bottom : $(selector).width() - margin.top - margin.bottom;
	var overtick = {top: 15, bottom: 18};
	var data = countries.map(function(id) { // take input countries and prepare the data
		
		var countryData = id >= 991 ? _.findWhere(state.aggregates, {id: +id}) : _.findWhere(state.countries, {id: +id});

		return {
			key: +id,
			name: countryData.name,
			qzname: countryData.qzname,
			values: config.years.map(function(y) { 
				return {
					year: y,
					value: countryData[y]
				}; 
			}) 
		};
	});


	// extract range from values to define y-axis range
	var valueExtent = [
		Math.floor(d3.min(data, function(countryData) { return d3.min(countryData.values, function(d) { return d.value; }); })-0.5),
		Math.ceil(d3.max(data, function(countryData) { return d3.max(countryData.values, function(d) { return d.value; }); })+0.5)
	];

	// scale values on axes
	var x = d3.scale.linear()
		.domain([1960,2013])
		.range([margin.left, width + margin.left]);

	var y = d3.scale.linear()
		.domain(valueExtent)
		.range([height, 0])
		// .nice(2);

	// define number of axis ticks based on screen size
	var ticknumberX = state.mapwidth <= 480 ? 5 : 10;
	var ticknumberY = valueExtent[1] - valueExtent[0] + 1

	if(ticknumberY > 6) {
		ticknumberY = (ticknumberY-1) / 2 + 1
	}

	// define the axes
	var xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom')
		.tickFormat(function(d) { return "’" + String(d).substring(2,4); })
		.ticks(ticknumberX)
		.tickSize(height + overtick.top + overtick.bottom);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient('left')
		.tickValues(help.exactTicks(valueExtent,ticknumberY))
		.tickSize(width + margin.left)
		.tickFormat(function(d,i) {
			return d == valueExtent[1] ? Math.round(d*10)/10 + "% female population" : Math.round(d*10)/10
		});

	var container = d3.select(selector);

	var svg = container.selectAll('svg').data([0]);
	var visEnter = svg.enter().append('svg') // visEnter is used for appending everything that should only be appended once
			.append("g")
				.attr('class', 'vis')
				.attr("transform", "translate(" + 0 + "," + margin.top + ")")
	svg.attr('width', (width + margin.left + margin.right) + "px")
		.attr('height', (height + margin.top + margin.bottom + overtick.top + overtick.bottom) + "px")
	


	var vis = container.select('.vis');



	// define the country line
	var line = d3.svg.line()
		.x(function(d) { return x(d.year); })
		.y(function(d) { return y(d.value); })
		//.interpolate("basis");

	visEnter.append("g")
		.attr('class', 'axis x-axis')
		

	vis.select('.x-axis').call(xAxis)
		.attr("transform", "translate(" + 0 + "," + (height - margin.bottom + overtick.top) + ")");

	visEnter.append("g")
		.attr('class', 'axis y-axis');

	vis.select('.y-axis').call(yAxis);

	//remove all fiftyline classes
	vis.selectAll(".fiftyline").classed("fiftyline",false);

	//add fiftyline class to any tick line that has a data point of exactly 50
	vis.selectAll(".y-axis .tick").filter(function(d){return d == 50})
		.selectAll("line")
		.classed("fiftyline",true)


	// set background for part of linechart that means balanced
	vis.selectAll(".chart-background").remove();

	vis.append("rect")
		.attr("y", y(50.5))
		.attr("height", y(49.5)-y(50.5))
		.attr("x", margin.left)
		.attr("width", width)
		.attr("class", "chart-background")
		// .attr("filter","url(#f_multiply)");

	console.log(data)

	var countryLine = vis.selectAll('.country-line')
		.data(data, function(d) { return d.key; });

	var countryLineEnter = countryLine.enter().append('g')
		.attr('class', 'country-line')
		.attr('stroke', function(d,i) {
			return d.key >= 990 ? qz_gray_2 : color_progression[i];
		}).attr('fill', function(d,i) {
			return d.key >= 990 ? qz_gray_2 : color_progression[i];
		}); // grey for world average;

	countryLine.exit().remove();

	countryLineEnter.append("path")
		.attr('class', 'country-line-path')
		.attr("fill","none")
	
	countryLine.selectAll("path")
		

	vis.selectAll('.country-line-path')
		.attr("d", function(d) { return line(d.values); })
		

	countryLineEnter.append("text")
		.attr("class", "legend")
		.attr("x", width + 3)

	countryLine.select('.legend')
		.each(function(d,i){
			if(selector != '.chart-usergenerated') {
				d.pos = labelPositioning[selector][d.key]
			}
			else {
				if(d.key == 999) {
					d.pos = {
						"dy":-0.4,
						"x": d.key != 999 ? 2013 : 1961,
						"anchor": d.key != 999 ? "end" : "start"
					}
				}
				else {
					var other_d = i == 0 ? data[i+1] : data[i-1]
					var ends_on_top = _.last(d.values).value > _.last(other_d.values).value
					var max_point = {value: -Infinity}
					var min_point = {value: Infinity}

					for (var i = d.values.length - 1; i >= 25; i--) {
						//limit to the last 25 years
						var v = d.values[i]
						if(v.value > max_point.value) {
							max_point = v
						}

						if(v.value < min_point.value) {
							min_point = v
						}
					};

					d.pos = {
						"dy": ends_on_top ? -0.4 : 1,
						"x":  ends_on_top ? max_point.year : min_point.year,
						"anchor": ends_on_top ? "middle" : min_point.year == 1986 ? "start" : "middle",
					}
				}
				
			}
			
		})
		.attr("y", function(d) {

			for (var i = d.values.length - 1; i >= 0; i--) {
				var val = d.values[i]
				if(val.year == d.pos.x) {
					return y(val.value)
				}
			};

			return 0

		})
		.attr("x", function(d) {return x(d.pos.x)})
		.attr("dy",function(d){return d.pos.dy + "em"})
		.attr("text-anchor",function(d){return d.pos.anchor})
		.style("stroke", "none") // grey for world average
		.text(function(d) {return d.qzname; })

		if(selector == ".chart-usergenerated") {
			//make sure label isn't off the edge
			vis.selectAll("text.legend").each(function(d,i) {
				var bbox = this.getBoundingClientRect()
				if(bbox.right > width) {
					d3.select(this).attr("text-anchor","end")
				}
			})
		}
		

}

function renderUserinput() {

	var userinput_wrap = d3.select('.userinput').selectAll('div.qz-select').data([0,1]);

	var userinput = userinput_wrap
		.enter()
		.append("div")
		.attr("class","qz-select")
		.append('select')
		.attr('class', function(d) {return 'userinput-' + d});

	userinput_wrap.append("div").attr("class","clearfix")

	var options = userinput.selectAll('option')
		.data(state.countries.filter(function(datum) { 
			return _.some(config.years, function(y) { return !isNaN(datum[y]); }); // filters all countries that have values for at least one (_.some) years
		})); 
	 
	options.enter()
		.append('option');

	options
		.text(function(d) {return d.name})
		.attr("value", function(d){ return d.id})
		.attr('selected',function(d) {
			var pd = d3.select(this.parentNode).datum();
			return state.userselected[pd] === +d.id ? 'selected' : null;});


	options.exit()
		.remove();

	userinput.on('change', function(d) { 
		actions.updateUserinput();
	})

}

function renderMapyear() {
	
	d3.selectAll(".mapyear").remove();

	var t = d3.select("#map").select("svg").append("text")
	.attr("height", 200)
	.attr("width", 250)
	.text(state.currentYear)
	.attr("class", "mapyear")
	.attr("transform", "translate("+ state.mapwidth/2 + "," + state.mapwidth*0.9 + ")")
	.style("font-size", state.mapwidth/4);
}


function init() {
	// START

	// load the world
	d3.json("data/world-110m.json", function(error, world) {
		  
		if (error) {
			console.error(error);
			return;
		}

		state.world = world;

		//load the data for all countries and prepare it
		d3.csv('data/data.csv')
			.row(function(d) { // go through all rows and make sure values are saved as numbers
				
				var row = { // save values for all columns that we need
					id: +d.ISO, 
					name: d['countryname'],
					qzname: help.country_to_qz_style(d['countryname']),
					entity : d ['entity']
				}

				config.years.forEach(function(year){ // save value for each year in a property with the year's name
					var v = d[year];
					row[year] = (v!=null && v.length > 0 ? +v : NaN);
				})

				return row;

			}) 
			.get(function(error, rows){
				if (error) {
					console.error(error);
					return;
				}

				actions.updateData(rows);
			});
	});



	d3.select('.play').on("click", actions.toggleTimeline);

	console.log("timeline " + state.timeline);
}


var throttleRender = throttle(function(){
		fm.resize()
		actions.updateSizes()
	}
	, 250);

$(document).ready(function () {
  $(window).resize(throttleRender);  
  $.bigfoot();
  init();
});

// it's the end of the code as we know it
