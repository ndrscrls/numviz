function Euler(gm)
{
	this.init(gm);
}

Euler.prototype = new Algorithm();
Euler.prototype.constructor = Euler;
Euler.superclass = Algorithm.prototype;

Euler.prototype.init = function(gm)
{
	Euler.superclass.init.call(this, gm);
	
	this.addControls();
}

Euler.prototype.reset = function()
{
	Euler.superclass.reset.call(this);
	
}

Euler.prototype.addControls =  function()
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

Euler.prototype.comenzarCallback = function()
{
	this.reset();
	this.func = this.functionField.value;
	this.x0 = Number(this.x0Field.value);
	this.y0 = Number(this.y0Field.value);
	this.end = Number(this.endField.value);
	this.h = Number(this.hField.value);
	this.implementAction(this.run.bind(this), "");	
}

Euler.prototype.run = function()
{
	this.commands = [];
	var x, y,
		x0, y0, xCount, points, sId, xAxisId, ldId;
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
		sId = this.IdIndex++;
		this.cmd('slopevector', sId, expr.evaluate({x: x, y: y}), x, y, x + h, 'solid', null, this.graphicsManager.getDefColor(3));
		this.cmd('step');
		x0 = x;
		y0 = y;
		y = y + h * expr.evaluate({x: x, y: y});
		x += h;
		xAxisId = this.IdIndex++;
		this.cmd('remove', sId);
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
	currentAlg = new Euler(gm);
}