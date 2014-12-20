/*

QUESTIONS:

- show above 60 color in legend to keep symmetry, even though it it not used in the map?
- add all colour steps as a legend along y-axis in linechart?

TODO:
- better colors for linecharts 
- tooltips for linecharts
- include aggregates to data (use column type to distinguish)
- fallback images for all charts (place in html to be overwritten once charts load)
- add userselected countries to url and read them from url if present (for sharing)
- add large current year number to lower part of the map

finish
- update chart numbering to reflect order
- manually correct positioning of country labels
- delete unnecessary code

nice to have
- tooltip accuracy (need a topojson with country center points)
- refactor manual repositioning of labels in linecharts
- autocomplete for user input: http://www.brightpointinc.com/clients/brightpointinc.com/library/autocomplete/download.html
*/


// CONFIG
var config = { 
	years: d3.range(1961,2014), // maximum value not included, so produces range 1961-2013
	timelineSpeed : 800, // after 0.8 seconds, next year appears
	color : d3.scale.threshold() // define steps for color changes in map
    		.domain([40,45,48,49,49.5,50.5,51,52,55,60])
			//.range(["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#e5f5e0", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d", "#8e0152"]), // blue, pink, green
			//.range(["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"]),
			.range(["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#e5f5e0", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"]),
	countryGroups: { // predefine country groups for linecharts, use ISO 999 to add world average
		"neighbors": [999,756,276,250,380,40], // Switzerland, Germany, France, Italy, Austria	
		"brics": [76,643,356,156,710], // Brazil, Russia, India, China, South Africa
		"arab": [999,682,48,512,784,634,414], //Saudi Arabia, Bahrain, Oman, United Arab Emirates, Qatar, Kuwait
		"mostrising": [999,344,144,524], //Hong Kong, Sri Lanka, Nepal
		"mostbalanced": [120,218,834,434], // Cameroon, Ecuador, Tanzania, Libya
		"warridden": [646,320,368,434, 116], // Rwanda ,Guatemala, Iraq, Libya, Cambodia
		"soviet": [643,804,112,233,428,999], // Russian Federation, Ukraine, Belarus, Estonia, Latvia	
		"mensworld": [356,156,586,50,999] // India, China, Pakistan, World
		}
	} 

// STATE
// store all input parameters for the visualisation in state so that we always know what state the visualisation is in

var state = {
	active : null,
	currentYear:d3.max(config.years), 
	countries: [],
	total: {},
	world: null,
	timeline: "ready",
	userselected: [32, 56, 999] // preset to argentina and belgium and world average
};

// ACTIONS

var actions = {
	updateYear : function(year) {
		state.currentYear = +year; // + turns strings into numbers
		renderMap();
		renderDatatext();
	},
	updateData : function(rows) {
		state.total = _.findWhere(rows, {name: "World average"});
		state.countries = _.without(rows, _.findWhere(rows, {name: "World average"}));
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
			d3.select('.play').html('<img src="/img/play.png"/>');
			return;
		}

		else if (state.timeline == "paused") {
			state.timeline = "playing";
			console.log("timeline " + state.timeline);
			actions.playTimeline();
		}
	},
	playTimeline : function() {
		
		d3.select('.play').html('<img src="/img/pause.png"/>');
		
		state.timelineInterval = setInterval(function(){
			
			if (state.currentYear == d3.max(config.years)) {
				d3.select('.play').html('<img src="/img/replay.png"/>');
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

		renderLinechart(".chart-9",state.userselected,"normal");
	},
	zoomIn : function(d) {
	  if (state.active === d) return reset();
	  svg.selectAll(".active").classed("active", false);
	  d3.select(this).classed("active", state.active = d);

	  var b = path.bounds(d);
	  svg.transition().duration(750).attr("transform",
	      "translate(" + projection.translate() + ")"
	      + "scale(" + .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height) + ")"
	      + "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");
	},
	reset : function() {
	  svg.selectAll(".active").classed("active", state.active = false);
	  svg.transition().duration(750).attr("transform", "");
	}
}



// RENDERING
// make one render() function and call all functions to render sub-elements within

function render() {  	
	// renderMenu(); // dropdown menu to let user switch between years manually
	renderDatatext();
	if (state.world && state.countries.length > 0) renderMap();
	renderKey(); // map legend
	renderLinechart(".chart-1", config.countryGroups.neighbors, "normal"); // where to place, what data to use
	renderLinechart(".chart-2", config.countryGroups.brics, "normal");
	renderLinechart(".chart-3", config.countryGroups.arab, "large");
	renderLinechart(".chart-4", config.countryGroups.mostrising, "normal");
	renderLinechart(".chart-5", config.countryGroups.mostbalanced, "normal");
	renderLinechart(".chart-6", config.countryGroups.warridden, "normal");
	renderLinechart(".chart-7", config.countryGroups.soviet, "normal");
	renderLinechart(".chart-8", config.countryGroups.mensworld,"normal");
	renderLinechart(".chart-9", state.userselected,"normal");
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
	
	var width = d3.select("#map").node().offsetWidth, // .node().offsetWidth reads width of element #map
    height = width;

	var projection = d3.geo.azimuthalEqualArea()
	    .clipAngle(180 - 1e-3)
	    .scale(237 / 960 * width)
	    .translate([width / 2, height / 2])
	    .precision(.1);

	// an alternative projection
	// var projection = d3.geo.orthographic()
	//     .scale(475)
	//     .translate([width / 2, height / 2])
	//     .clipAngle(90)
	//     .precision(.1);

	var path = d3.geo.path()
	    .projection(projection);

	var graticule = d3.geo.graticule();

	// var λ = d3.scale.linear()
 //    .domain([0, width])
 //    .range([-180, 180]);

	// var φ = d3.scale.linear()
 //    .domain([0, height])
 //    .range([90, -90]);

	var map = d3.select("#map");

	var svg = map.selectAll('svg').data([0]);

	var svgEnter = svg.enter()
		.append("svg")
	    .attr("width", width)
	    .attr("height", height);

	svgEnter.append("defs").append("path")
	    .datum({type: "Sphere"})
	    .attr("id", "sphere")
	    .attr("d", path);

	//circle around the globe
	svgEnter.append("use")
	    .attr("class", "stroke")
	    .attr("xlink:href", "#sphere");

	svgEnter.append("use")
	    .attr("class", "fill")
	    .attr("xlink:href", "#sphere");

	svgEnter.append("path")
	    .datum(graticule)
	    .attr("class", "graticule")
	    .attr("d", path);

	var countries = svg.selectAll('.country').data(topojson.feature(state.world, state.world.objects.countries).features);

	countries.enter()
	  	.insert("path", ".graticule")
	    .attr("class", "country")
	    .attr("title", function(d) { return d.name;})
	    .attr("id", function(d) { return "country-" + d.id;})
	    .attr("d", path);
	    // .on('click', zoomIn()); TODO make zooming in work, see http://techslides.com/d3-world-maps-tooltips-zooming-and-queue

	svgEnter.insert("path", ".graticule")
      .datum(topojson.mesh(state.world, state.world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

      // rotate the globe on mouseover 

	// svg.on("mousemove", function() {
 // 	 		var p = d3.mouse(this);
 // 	 		projection.rotate([λ(p[0]), φ(p[1])]);
 // 		 	svg.selectAll("path").attr("d", path);
	// });

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
    .tickSize(9)
    .tickValues([40,45,48,49,51,52,55,60]); // left out two middle values for space, to generate tick values dynamically: config.color.domain()

    var g = d3.select("#map").selectAll('svg').append("g")
	    .attr("class", "key")
	    .attr("transform", "translate(250,30)"); // position within the svg space 250 to the right, 700 from top, TODO: make responsive

	g.selectAll("rect")
	    .data(config.color.range().map(function(d, i) {
	      return {
	        x0: i ? x(config.color.domain()[i - 1]) : x.range()[0],
	        x1: i < config.color.domain().length ? x(config.color.domain()[i]) : x.range()[1],
	        z: d
	      };
	    }))
	  .enter().append("rect")
	    .attr("height", 8)
	    .attr("x", function(d) { return d.x0; })
	    .attr("width", function(d) { return d.x1 - d.x0; })
	    .style("fill", function(d) { return d.z; });
	    // .attr("x", function(d,i) { return i*(x.range()[1]/ config.color.domain().length) }) // alternative with all rects same size
	    // .attr("width", x.range()[1]/ config.color.domain().length)

	g.call(xAxis).append("text")
	    .attr("class", "caption")
	    .attr("y", -6)
	    .text("Percentage of women in population");
}

function renderLinechart(selector, countries, size) {

	// manual label position corrections (refactor to come as a param)
	var countryLabelPositionDeltas = {
		'.chart-1': {
			
		},
		'.chart-2': {
			356: -3,
			156: +3

		},
		'.chart-3': {
			
		},
		'.chart-4': {

			
		},
		'.chart-5': {

			834: -10,
			218: +10,
			434: +20
			
		},
		'.chart-6': {
			320: -2,
			646: +4,
			760: +3,
			4: +3
			
		}
		,
		'.chart-7': {
			804: -3,
			643: +7,
			112: +5,
			643: -5

			
		},
		'.chart-8': {
			
		},

		'.chart-9': {
			
		}
	};
	var margin = {top: 20, right: 75, bottom: 20, left: 50};
	var width = d3.select(selector).node().offsetWidth - margin.left - margin.right,
	    height = size == "normal" ? d3.select(selector).node().offsetWidth/2 - margin.top - margin.bottom : d3.select(selector).node().offsetWidth - margin.top - margin.bottom;

	var data = countries.map(function(id) { // take input countries and prepare the data
		
		var countryData = id === 999 ? state.total : _.findWhere(state.countries, {id: +id});

		return {
			key: +id,
			name: countryData.name,
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
		d3.min(data, function(countryData) { return d3.min(countryData.values, function(d) { return d.value; }); }),
		d3.max(data, function(countryData) { return d3.max(countryData.values, function(d) { return d.value; }); })
	];

	var colorScale = d3.scale.category10();

	// scale values on axes
	var x = d3.scale.linear()
		.domain(d3.extent(config.years))
		.range([0, width]);

	var y = d3.scale.linear()
		.domain(valueExtent)
		.range([height, 0])
		.nice(2);

	// draw the line
	var line = d3.svg.line()
		.x(function(d) { return x(d.year); })
	    .y(function(d) { return y(d.value); })
	    .interpolate("basis");

	// draw the axes
	var xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom')
		.tickFormat(function(d) { return +d; });

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient('left');

	var container = d3.select(selector);

	var svg = container.selectAll('svg').data([0]);
	var visEnter = svg.enter().append('svg') // visEnter is used for appending everything that should only be appended once
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
	.append("g")
		.attr('class', 'vis')
    	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    var vis = container.select('.vis');

    // set red-ish background for part of linechart that means more women
    visEnter.append("rect")
	    .attr("height", y(50))
	    .attr("x", 0)
	    .attr("width", width)
	    .attr("class", "chart-background")
	    .style("fill", "#8e0152");

    // set blue-ish background for part of linechart that means more women
	visEnter.append("rect")
	    .attr("height", height-y(50))
	    .attr("y", y(50))
	    .attr("x", 0)
	    .attr("width", width)
	    .attr("class", "chart-background")
	    .style("fill", "#053061");

    visEnter.append("g")
    	.attr('class', 'axis x-axis')
    	.attr("transform", "translate(" + 0 + "," + height + ")");

	vis.select('.x-axis').call(xAxis);

    visEnter.append("g")
    	.attr('class', 'axis y-axis');

	vis.select('.y-axis').call(yAxis);

    var countryLine = vis.selectAll('.country-line')
    	.data(data, function(d) { return d.key; });

    var countryLineEnter = countryLine.enter().append('g')
    	.attr('class', 'country-line');

    countryLine.exit().remove();

    countryLineEnter.append("path")
		.attr('class', 'country-line-path')

	vis.selectAll('.country-line-path')
		.attr("d", function(d) { return line(d.values); })
		.attr('stroke', function(d) { if (d.key === 999) {return "#c7c7c7"} else {return colorScale(d.key); }}); // grey for world average

	countryLineEnter.append("text")
	    .attr("class", "legend")
	    .attr("x", width + 3)

	countryLine.select('.legend')
	    .attr("y", function(d) {return y(_.last(d.values).value)+2 + 
	                                   (countryLabelPositionDeltas[selector][d.key] || 0)}) // +2 to correct visual appearance
	    .text(function(d) {return d.name; })
	    .style("fill", function(d) { if (d.key === 999) {return "#c7c7c7"} else {return colorScale(d.key); }}); // grey for world average

}

function renderUserinput() {

	var userinput = d3.select('.userinput').selectAll('select').data([0,1]);

	userinput.enter()
		.append('select')
		.attr('class', function(d) {return 'userinput-' + d});

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


// START

// load the world
d3.json("data/world-110m.json", function(error, world) {
	  
	if (error) {
		console.error(error);
		return;
	}

	state.world = world;
});

//load the data for all countries and prepare it
d3.csv('data/data.csv')
	.row(function(d) { // go through all rows and make sure values are saved as numbers
		
		var row = { // save values for all columns that we need
			id: +d.ISO, 
			name: d['countryname']
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

d3.select('.play').on("click", actions.toggleTimeline);

console.log("timeline " + state.timeline);

// function zoomIn(d) {
//   if (state.active === d) return reset();
//   g.selectAll(".active").classed("active", false);
//   d3.select(this).classed("active", active = d);

//   var b = path.bounds(d);
//   g.transition().duration(750).attr("transform",
//       "translate(" + projection.translate() + ")"
//       + "scale(" + .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height) + ")"
//       + "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");
// }

// function reset() {
//   g.selectAll(".active").classed("active", active = false);
//   g.transition().duration(750).attr("transform", "");
// }



// it's the end of the code as we know it