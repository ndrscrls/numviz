function RungeKutta(gm)
{
	this.init(gm);
}

RungeKutta.prototype = new Algorithm();
RungeKutta.prototype.constructor = RungeKutta;
RungeKutta.superclass = Algorithm.prototype;

RungeKutta.prototype.init = function(gm)
{
	RungeKutta.superclass.init.call(this, gm);
	
	this.addControls();
}

RungeKutta.prototype.reset = function()
{
	RungeKutta.superclass.reset.call(this);
	
}

RungeKutta.prototype.addControls =  function()
{
	this.functionLabel = this.addLabelToAlgorithmBar("y' = ");
    this.functionField = this.addControlToAlgorithmBar("Text", "", "y - x^2 + 1", true);
	this.x0Label = this.addLabelToAlgorithmBar("x0 = ");
    this.x0Field = this.addControlToAlgorithmBar("Text", "", "0", true, 4);

	this.y0Label = this.addLabelToAlgorithmBar("y(x0) = ");
    this.y0Field = this.addControlToAlgorithmBar("Text", "", "0.5", true, 4);

	this.endLabel = this.addLabelToAlgorithmBar("x1");
    this.endField = this.addControlToAlgorithmBar("Text", "", "4", true, 4);

	this.hLabel = this.addLabelToAlgorithmBar("h");
    this.hField = this.addControlToAlgorithmBar("Text", "", "0.4", true, 4);

	this.comenzarButton = this.addControlToAlgorithmBar("button", "comenzar", "Comenzar", true);
	this.comenzarButton.onclick = this.comenzarCallback.bind(this);
}

RungeKutta.prototype.comenzarCallback = function()
{
	this.reset();
	this.func = this.functionField.value;
	this.x0 = Number(this.x0Field.value);
	this.y0 = Number(this.y0Field.value);
	this.end = Number(this.endField.value);
	this.h = Number(this.hField.value);
	this.implementAction(this.run.bind(this), "");	
}

RungeKutta.prototype.run = function()
{
	this.commands = [];
	var x, y, k1, k2,
		x0, y0, xCount, points, sId1, sId2, sId3, xAxisId, ldId;
	var expr;

	xCount = 1;
	this.IdIndex = 2;
	expr = Parser.parse(this.func);
	x0 = this.x0;
	y0 = this.y0;
	h = this.h;

	this.cmd('gm_option', 'minX', x0 - 1);
	this.cmd('gm_option', 'maxX', this.end + 1);
	this.cmd('gm_option', 'stepX', 2);
	this.cmd('gm_redraw');
	points = [];
	y = y0;
	hmin = 0.001;
	for (var i = x0; i <= this.end; i+=hmin)
	{	
		points.push([i, y]);
		y = y + hmin * expr.evaluate({x: i, y: y});
	}
	this.cmd('path', this.IdIndex++, points, "Solución exacta", '#c0d0e0');
	this.cmd('step');
	
	x = x0;
	y = y0;
	this.cmd('point', this.IdIndex++, x, y, 'diamond', 'x0, y(x0)', this.graphicsManager.getDefColor(0));
	this.cmd('step');
	
	while (x < this.end)
	{
		x0 = x;
		y0 = y;
		k1 = h * expr.evaluate({x: x, y: y});
		k2 = h * expr.evaluate({x: x + h, y: y + k1});
		sId1 = this.IdIndex++;
		this.cmd('slopevector', sId1, expr.evaluate({x: x, y: y}), x, y, x + h, 'solid', 'k1', this.graphicsManager.getDefColor(3));
		sId2 = this.IdIndex++;
		this.cmd('slopevector', sId2, expr.evaluate({x: x + h, y: y + k1}), x, y, x + h, 'solid', 'k2', this.graphicsManager.getDefColor(2));
		this.cmd('step');
		sId3 = this.IdIndex++;
		this.cmd('slopevector', sId3, (expr.evaluate({x: x, y: y}) + expr.evaluate({x: x + h, y: y + k1}))/2, x, y, x + h, 'solid', '(k1 + k2)/2', this.graphicsManager.getDefColor(4));
		this.cmd('step');
		y = y + (k1 + k2)/2;
		x += h;
		xAxisId = this.IdIndex++;
		this.cmd('remove', sId1);
		this.cmd('remove', sId2);
		this.cmd('remove', sId3);
		this.cmd('point', xAxisId, x, 0, 'circle', 'x' + xCount, this.graphicsManager.getDefColor(2));
		this.cmd('point', this.IdIndex++, x, y, 'diamond', 'x' + xCount + ' , y(x' + xCount + ')', this.graphicsManager.getDefColor(0));
		ldId = this.IdIndex++;
		this.cmd('line', ldId, x, 0, x, y, 'dashed', null, this.graphicsManager.getDefColor(2));
		this.cmd('step');
		this.cmd('line', this.IdIndex++, x0, y0, x, y, 'solid', null, this.graphicsManager.getDefColor(7));
		this.cmd('step');
		this.cmd('remove', ldId);
		this.cmd('step');
		xCount++;
	}
	return this.commands;
}

var currentAlg;

function init()
{
	var gm = new GraphicsManager({
					canvas : 'canvas',
					maxY:8,
					minY:-8,
					maxX: 8,
					minX: -8,
				});
	currentAlg = new RungeKutta(gm);
}