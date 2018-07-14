/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
function bubbleChart() {
  // Constants for sizing
  var width = 940;
  var height = 600;

  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('gates_tooltip', 240);

  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };

  // @v4 strength to apply to the position forces
  var forceStrength = 0.03;

  // These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  // Charge function that is called for each node.
  // As part of the ManyBody force.
  // This is what creates the repulsion between nodes.
  //
  // Charge is proportional to the diameter of the
  // circle (which is stored in the radius attribute
  // of the circle's associated data.
  //
  // This is done to allow for accurate collision
  // detection with nodes of different sizes.
  //
  // Charge is negative because we want nodes to repel.
  // @v4 Before the charge was a stand-alone attribute
  //  of the force layout. Now we can use it as a separate force!
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  // @v4 Force starts up automatically,
  //  which we don't want as there aren't any nodes yet.
  simulation.stop();

  // Nice looking colors - no reason to buck the trend
  // @v4 scales now have a flattened naming scheme
  var fillColor = d3.scaleOrdinal()
    .domain(['low', 'medium', 'high'])
    .range(['#d84b2a', '#beccae', '#7aa25c']);


  /*
   * This data manipulation function takes the raw data from
   * the CSV file and converts it into an array of node objects.
   * Each node will store data and visualization values to visualize
   * a bubble.
   *
   * rawData is expected to be an array of data objects, read in from
   * one of d3's loading functions like d3.csv.
   *
   * This function returns the new node array, with a node in that
   * array for each element in the rawData input.
   */
  function createNodes(rawData) {
    // Use the max total_amount in the data as the max in the scale's domain
    // note we have to ensure the total_amount is a number.
    var maxPrice = d3.max(d3.values(rawData.data), function (d) { return d.quotes.USD.price; });
    var maxPercentChange = d3.max(d3.values(rawData.data), function (d) { return d.quotes.USD.percent_change_24h; });
    var minPercentChange = d3.min(d3.values(rawData.data), function (d) { return d.quotes.USD.percent_change_24h; });
    // Sizes bubbles based on price.
    // @v4: new flattened scale names.
    var radiusScaleValue = d3.scalePow()
      .exponent(0.15)
      .range([2, 85])
      .domain([0, maxPrice]);

      // Sizes bubbles based on percent.
    var radiusScalePercent = d3.scalePow()
      .exponent(0.9)
      .range([2, 85])
      .domain([minPercentChange, maxPercentChange]);

    var valueNodes = [];
    var percentNodes = [];

    //creating to lists of values, in one, we will set the radius of bubble depending on percent, in another on price
    for(var key in rawData.data){
      valueNodes.push({
        radius: radiusScaleValue(+rawData.data[key].quotes.USD.price),
        id: rawData.data[key].id,
        name: rawData.data[key].name,
        symbol: rawData.data[key].symbol,
        price: rawData.data[key].quotes.USD.price,
        group: rawData.data[key].quotes.USD.price < 30 ? "low" : rawData.data[key].quotes.USD.price > 500 ? "high" : "medium",
        percentChange: rawData.data[key].quotes.USD.percent_change_24h
      })

      percentNodes.push({
        radius: radiusScalePercent(+rawData.data[key].quotes.USD.percent_change_24h),
        id: rawData.data[key].id,
        name: rawData.data[key].name,
        symbol: rawData.data[key].symbol,
        price: rawData.data[key].quotes.USD.price,
        group: rawData.data[key].quotes.USD.percent_change_24h < 1 ? "low" : rawData.data[key].quotes.USD.percent_change_24h > 10 ? "high" : "medium",
        percentChange: rawData.data[key].quotes.USD.percent_change_24h
      })
    }
   // sort them to prevent occlusion of smaller nodes.
    valueNodes.sort(function (a, b) { return b.price - a.price; });
    percentNodes.sort(function (a, b) { return b.price - a.price; });

    //returning an object with two lists of values
    return {
      "valueChart" : valueNodes,
      "percentChart" : percentNodes 
    };
  }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {
    // convert raw data into nodes data
    var button = document.getElementById('toggleButton');
    
    nodes = createNodes(rawData);
    //checking the state of the button. and changing the chart and the chart's name
    if(button.classList.contains("clicked")){
      nodes = nodes.percentChart;
      document.getElementById('chartName__name').innerHTML = "Chart depends on the last 24h percent change of the coin";
    }else{
      nodes = nodes.valueChart;
      document.getElementById('chartName__name').innerHTML = "Chart depends on the current value of the coin";
    }
    // Create a SVG element inside the provided selector
    // with desired size.

    //this is needed for an asvg element not to duplicate. 
    //We chack if the element already exist, just select that element and rewrite it with new data
    if (document.getElementsByTagName('svg')[0]) {
      svg = d3.select(selector)
      .select('svg')
      .attr('width', width)
      .attr('height', height);
    }
    else{
      svg = d3.select(selector)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    }

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { 
        return d.id;
      });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.
    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.group); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { 
        //console.log(d.radius);
        return d.radius; 
      });

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(nodes);

    // Set initial layout to single group.
    groupBubbles();
  };

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked() {
    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  /*
   * Sets visualization in "single group mode".
   * The year labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
  function groupBubbles() {
    // @v4 Reset the 'x' force to draw the bubbles to the center.
    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }

  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Coin name: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Current price(USD): </span><span class="value">$' +
                  (d.price) +
                  '</span><br/>' +
                  '<span class="name">Percent change in last 24h: </span><span class="value">' +
                  d.percentChange + "%"
                  '</span>';

    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Hides tooltip
   */
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d3.rgb(fillColor(d.group)).darker());

    tooltip.hideTooltip();
  }

  // return the chart function from closure.
  return chart;
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
function setupButtons() {
  d3.select('.button')
    .on('click', function(){
      var button = document.getElementById('toggleButton');
      button.classList.toggle("clicked");
      d3.json('https://api.coinmarketcap.com/v2/ticker/?limit=50&sort=rank', display);
    })
}

// Load the data.
d3.json('https://api.coinmarketcap.com/v2/ticker/?limit=50&sort=rank', display);

// setup the buttons.
setupButtons();
