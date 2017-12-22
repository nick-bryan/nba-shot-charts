// Global variables
var w = 500,                        //width of court
	h = 440,                        //height of court
	margin = {						//padding
		top: 20, 
		right: 20, 
		bottom: 20, 
		left: 50},
	col = 30,                       //number of hexagons from left to right
	r = w / (Math.sqrt(3) * col),   //radius of largest possible hexagon
	del_r = 2;             			//remove hexagons with small radius

var svg = d3.select("body")
	.append("svg")
	.attr("width", w + margin.left + margin.right)
	.attr("height", h + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Draw court
svg.append("rect")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", w)
	.attr("height", h)
	.attr("fill", "rgb(255,250,245)")
	.attr("stroke", "black")
	.attr("stroke-width", "2");
	
// Draw lane
svg.append("rect")
	.attr("x", w/2 - 80)
	.attr("y", h - 190)
	.attr("width", 160)
	.attr("height", 190)
	.attr("stroke", "black")
	.attr("stroke-width", "2")
	.attr("fill", "none");
svg.append("circle")
	.attr("cx", 250)
	.attr("cy", h - 190)
	.attr("r", 60)
	.attr("stroke", "black")
	.attr("stroke-width", "2")
	.attr("fill", "none");
	
// Draw 3-point line
svg.append("line")
	.attr("x1", 30)
	.attr("y1", h)
	.attr("x2", 30)
	.attr("y2", h - 140)
	.attr("stroke", "black")
	.attr("stroke-width", "2");
svg.append("line")
	.attr("x1", w - 30)
	.attr("y1", h)
	.attr("x2", w - 30)
	.attr("y2", h - 140)
	.attr("stroke", "black")
	.attr("stroke-width", "2");
svg.append("path")
	.attr("d", "M30 300 A 237.5 237.5 45 0 1 470 300")
	.attr("fill", "none")
	.attr("stroke", "black")
	.attr("stroke-width", "2");
	
// Draw hoop and backboard
svg.append("circle")
	.attr("cx", w/2)
	.attr("cy", h - 50)
	.attr("r", 7.5)
	.attr("stroke", "black")
	.attr("stroke-width", "2")
	.attr("fill", "none");
svg.append("line")
	.attr("x1", w/2 - 30)
	.attr("y1", h - 40)
	.attr("x2", w/2 + 30)
	.attr("y2", h - 40)
	.attr("stroke", "black")
	.attr("stroke-width", "3");

// Create player shot chart
function render(dataset, player){

	var g = d3.select("svg")
		.append("g")
		.attr("id","player-shots")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	// NBA data treats hoop as (0,0), so coordinates need to be shifted by 250/50
	var hexbin = d3.hexbin()
		.x(function x(d) {return d.LOC_X + 250;})
		.y(function y(d) {return h - (d.LOC_Y + 50);})
		.radius(r);

	var colorscale = d3.scaleQuantile().domain([-0.06666666,0.06666666])
		.range(['blue','lightblue','yellow','orange','red']);

	var radius = d3.scaleLinear()
		.domain([0,5])
		.range([0,r])
		.clamp(true);

	// Draw hexagon bins
	g.selectAll("path")
	   .data(hexbin(dataset))
	   .enter()
	   .append("path")
	   .attr("d", function(d) {
			d_r = radius(d.length);
			if(d_r < del_r){
				d_r = 0;
			}
			return hexbin.hexagon(d_r);
		})
	   .attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		})
	   .attr("fill", function(d) {
			var sum = 0
			for(i = 0; i < d.length; i++){
				sum += d[i].DIFF;
			}
			return colorscale(sum/d.length);
		})
	   .attr("stroke", "black")
	   .attr("stroke-width", "1px");
	   
	// Player and Season Labels
	g.append("text")
		.text(player)
		.attr("x", w/2)
		.attr("y", 50)
		.attr("font-family", "sans-serif")
		.attr("font-size", "28px")
		.attr("text-anchor", "middle");
	g.append("text")
		.text("2017-18 Season")
		.attr("x", w/2)
		.attr("y", 70)
		.attr("font-family", "sans-serif")
		.attr("font-size", "16px")
		.attr("text-anchor", "middle");
		
	// Volume Key
	g.append("path")
		.attr("d", hexbin.hexagon(3))
		.attr("transform", "translate(25, 50)")
		.attr("fill", "yellow")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("path")
		.attr("d", hexbin.hexagon(4.75))
		.attr("transform", "translate(35, 50)")
		.attr("fill", "yellow")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("path")
		.attr("d", hexbin.hexagon(6.5))
		.attr("transform", "translate(48.5, 50)")
		.attr("fill", "yellow")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("path")
		.attr("d", hexbin.hexagon(8.25))
		.attr("transform", "translate(65.5, 50)")
		.attr("fill", "yellow")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("path")
		.attr("d", hexbin.hexagon(10))
		.attr("transform", "translate(85, 50)")
		.attr("fill", "yellow")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("text")
		.text("Shot Volume")
		.attr("x", 57)
		.attr("y", 35)
		.attr("font-family", "sans-serif")
		.attr("font-size", "12px")
		.attr("text-anchor", "middle");

	// Efficiency Key
	g.append("path")
		.attr("d", hexbin.hexagon(7))
		.attr("transform", "translate(415, 50)")
		.attr("fill", "blue")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("path")
		.attr("d", hexbin.hexagon(7))
		.attr("transform", "translate(430, 50)")
		.attr("fill", "lightblue")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("path")
		.attr("d", hexbin.hexagon(7))
		.attr("transform", "translate(445, 50)")
		.attr("fill", "yellow")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("path")
		.attr("d", hexbin.hexagon(7))
		.attr("transform", "translate(460, 50)")
		.attr("fill", "orange")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("path")
		.attr("d", hexbin.hexagon(7))
		.attr("transform", "translate(475, 50)")
		.attr("fill", "red")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");
	g.append("text")
		.text("Shot Efficiency")
		.attr("x", 445)
		.attr("y", 35)
		.attr("font-family", "sans-serif")
		.attr("font-size", "12px")
		.attr("text-anchor", "middle");
		
	// Draw hoop and backboard
	g.append("circle")
		.attr("cx", w/2)
		.attr("cy", h - 50)
		.attr("r", 7.5)
		.attr("stroke", "black")
		.attr("stroke-width", "2")
		.attr("fill", "none");
	g.append("line")
		.attr("x1", w/2 - 30)
		.attr("y1", h - 40)
		.attr("x2", w/2 + 30)
		.attr("y2", h - 40)
		.attr("stroke", "black")
		.attr("stroke-width", "3");
		
	
};