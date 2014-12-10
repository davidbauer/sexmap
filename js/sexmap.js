/*

QUESTIONS:
- how to better distinguish between missing and near-50%-values
- whats up with greenland (dark blue even though no values), id -99, id 10

TODO:
- finish color legend for map, tick positioning on y axis alternating or just remove middle 2?: http://bl.ocks.org/mbostock/5144735
- line chart
*/


// CONFIG
var config = { 
	years: d3.range(1961,2014), // maximum value not included, so produces range 1961-2013
	color : d3.scale.threshold() // TODO: improve
    		.domain([40,45,48,49,49.8,50.2,51,52,55,60])
			.range(["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#e5f5e0", "#fde0ef", "#f1b6da", "#de77ae", "#c51b7d", "#8e0152"])
	// predefine country groups for linecharts

	} 

// STATE
// store all input parameters for the visualisation in state so that we always know what state the visualisation is in

var state = {
	currentYear:d3.max(config.years), 
	countries: [],
	total: {},
	world: null,
	timeline: "ready"
};

// ACTIONS

var actions = {
	updateYear : function(year) {
		state.currentYear = +year; // + turns strings into numbers
		render();
	},
	updateData : function(rows) {
		state.total = _.findWhere(rows, {name: "World"});
		state.countries = _.without(rows, _.findWhere(rows, {name: "World"}));
		render();
	},
	toggleTimeline : function () {

		if (state.timeline == "ready") {
			state.timeline = "playing";
			console.log(state.timeline);
			state.currentYear = d3.min(config.years);
			actions.playTimeline();
		}

		else if (state.timeline == "playing") {
			state.timeline = "paused";
			clearInterval(state.timelineInterval);
			state.timelineInterval = null;
			console.log(state.timeline);
			d3.select('.play').text("Resume");
			return;
		}

		else if (state.timeline == "paused") {
			state.timeline = "playing";
			console.log(state.timeline);
			actions.playTimeline();
		}
	},
	playTimeline : function() {
		
		d3.select('.play').text("Pause");
		
		state.timelineInterval = setInterval(function(){
			
			if (state.currentYear == d3.max(config.years)) {
				d3.select('.play').text("Play again");
				state.timeline = "ready";
			}

			if (state.timeline == "playing") {
				state.currentYear += 1;
				console.log("Visualising data from " + state.currentYear);
				render();
			}

			else return;
		},800)
	}
}



// RENDERING

function render() { // make one render() function and call all functions to render sub-elements within 	
	renderMenu();
	renderDatatext();
	if (state.world && state.countries.length > 0) renderMap();
	renderKey(); // map legend
	renderLinechart();
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
  			return country[state.currentYear] > 50 ? 'female': 'male';
  		}
	});

	d3.select('.currentMaleCountries').text(sexcount['male']);
	d3.select('.currentFemaleCountries').text(sexcount['female']);

}

function renderMap() {
	
	var width = d3.select("#map").node().offsetWidth, // .node().offsetWidth reads width of element #map
    height = width;

	// var projection = d3.geo.orthographic()
	//     .scale(475)
	//     .translate([width / 2, height / 2])
	//     .clipAngle(90)
	//     .precision(.1);

	var projection = d3.geo.azimuthalEqualArea()
	    .clipAngle(180 - 1e-3)
	    .scale(237 / 960 * width)
	    .translate([width / 2, height / 2])
	    .precision(.1);

	var path = d3.geo.path()
	    .projection(projection);

	var graticule = d3.geo.graticule();

	// var λ = d3.scale.linear()
 //    .domain([0, width])
 //    .range([-180, 180]);

	// var φ = d3.scale.linear()
 //    .domain([0, height])
 //    .range([90, -90]);

	var map = d3.select("#map").selectAll('svg').data([0]);

	var svg = map.enter()
		.append("svg")
	    .attr("width", width)
	    .attr("height", height);

	svg.append("defs").append("path")
	    .datum({type: "Sphere"})
	    .attr("id", "sphere")
	    .attr("d", path);

	svg.append("use")
	    .attr("class", "stroke")
	    .attr("xlink:href", "#sphere");

	svg.append("use")
	    .attr("class", "fill")
	    .attr("xlink:href", "#sphere");

	svg.append("path")
	    .datum(graticule)
	    .attr("class", "graticule")
	    .attr("d", path);

	var countries = map.selectAll('.country').data(topojson.feature(state.world, state.world.objects.countries).features); // TODO: make sure countries are created only once
	  
	countries.enter()
	  	.insert("path", ".graticule")
	    .attr("class", "country")
	    .attr("title", function(d) { return d.name;})
	    .attr("id", function(d) { return "country-" + d.id;})
	    .attr("d", path);

	svg.insert("path", ".graticule")
      .datum(topojson.mesh(state.world, state.world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

      // drag to rotate via zoom function

 //    svg.on("mousemove", function() {
 //  		var p = d3.mouse(this);
 //  		projection.rotate([λ(p[0]), φ(p[1])]);
 //  		svg.selectAll("path").attr("d", path);
	// });

	countries
		.style({'fill': function(d) {
			var countryData = _.findWhere(state.countries, {id: +d.id}); // underscore method to find an object in an array based on property id
			if (countryData) {
		 		return config.color(countryData[state.currentYear]); // colour contries
		 	}
		 	return '#f0f0f0'; // TODO: find better way to represent missing data
		}
		});
}

function renderKey() {

	var x = d3.scale.linear()
    .domain([37, 57]) // range of values to be included in the legend
    .range([0, 300]); // defines length of legend

	var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(9)
    .tickValues(config.color.domain());

    var g = d3.select("#map").selectAll('svg').append("g")
	    .attr("class", "key")
	    .attr("transform", "translate(250,700)"); // position within the svg space 250 to the right, 700 from top, TODO: make responsive

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

function renderLinechart(selector, countries) {

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
d3.csv('data/sexratios_inclworld.csv')
	.row(function(d) { // go through all rows and make sure values are saved as numbers
		
		var row = { // save values for all columns that we need
			id: +d.ISO, 
			name: d['Country Name']
		}

		config.years.forEach(function(year){ // save value for each year in a property with the year's name
			row[year] = +d[year]
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

render(); // start rendering

d3.select('.play').on("click", actions.toggleTimeline); // TODO: what's a good place to put this?

console.log(state.timeline);


// it's the end of the code as we know it