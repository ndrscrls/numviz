function Derivada(gm)
{
	this.init(gm);
}

Derivada.prototype = new Algorithm();
Derivada.prototype.constructor = Derivada;
Derivada.superclass = Algorithm.prototype;


Derivada.prototype.init = function(gm)
{
	Derivada.superclass.init.call(this, gm);
	
	this.addControls();
	this.graphicsManager.setSpeedFactor(100);
}

Derivada.prototype.addControls =  function()
{
	this.functionLabel = this.addLabelToAlgorithmBar("y = ");
    this.functionField = this.addControlToAlgorithmBar("text", "", "(x + 1)^2 - 0.5*exp(x)", true);

	this.aLabel = this.addLabelToAlgorithmBar("a = ");
    this.aField = this.addControlToAlgorithmBar("text", "", "2", true, 4);

	this.bLabel = this.addLabelToAlgorithmBar("b = ");
    this.bField = this.addControlToAlgorithmBar("text", "", "4", true, 4);

	this.comenzarButton = this.addControlToAlgorithmBar("button", "comenzar", "Comenzar", true);
	this.comenzarButton.onclick = this.comenzarCallback.bind(this);
}

Derivada.prototype.comenzarCallback = function()
{
	this.reset();
	this.func = this.functionField.value;
	this.a = Number(this.aField.value);
	this.b = Number(this.bField.value);
	this.implementAction(this.run.bind(this), "");	
}


Derivada.prototype.run = function()
{
	this.commands = [];
	var x, r1Id = null, p1Id = null, p2Id, l1Id;
	var expr;

	this.IdIndex = 1;
	step = 2;
	expr = Parser.parse(this.func);
	a = this.a;
	b = this.b;
	this.cmd('gm_option', 'minX', a - 2);
	this.cmd('gm_option', 'maxX', b + 2);
	this.cmd('gm_option', 'stepX', 2);
	this.cmd('gm_option', 'animate', false);
	this.cmd('gm_redraw');
	this.cmd('plot', this.IdIndex++, this.func, a-2, b+2, this.functionField.value);
	this.cmd('step');
	this.cmd('point', this.IdIndex++, a, 0, 'diamond', 'a');
	this.cmd('point', this.IdIndex++, a, expr.evaluate({x : a}), 'diamond', 'f(a)');
	this.cmd('line', this.IdIndex++, a, 0, a, expr.evaluate({x : a}), 'dashed', null, this.graphicsManager.getDefColor(2));
	this.cmd('step');
	x = b;
	while (Math.abs(a - x) > 0.001)
	{
		if (p1Id)
		{
			this.cmd('move', p1Id, x, 0);
			this.cmd('move', p2Id, x, expr.evaluate({x : x}));
			this.cmd('option', l1Id, 'x0', x);
			this.cmd('option', l1Id, 'y0', 0);
			this.cmd('option', l1Id, 'x1', x);
			this.cmd('option', l1Id, 'y1', expr.evaluate({x : x}));
			this.cmd('redraw', l1Id);
			this.cmd('step');
		}
		else
		{
			p1Id = this.IdIndex++;
			this.cmd('point', p1Id, x, 0, 'diamond', 'b');
			p2Id = this.IdIndex++;
			this.cmd('point', p2Id, x, expr.evaluate({x : x}), 'diamond', 'f(b)');
			l1Id = this.IdIndex++;
			this.cmd('line', l1Id, x, 0, x, expr.evaluate({x : x}), 'dashed', null, this.graphicsManager.getDefColor(2));
			this.cmd('step');
		}
		v = {
			x: x - a,
			y: expr.evaluate({x : x}) - expr.evaluate({x : a})
		};
		d = Math.sqrt(v.x*v.x + v.y*v.y);
		v.x = v.x/d;
		v.y = v.y/d;
		if (r1Id)
		{
			this.cmd('option', r1Id, 'x0', a - v.x * 10);
			this.cmd('option', r1Id, 'y0', expr.evaluate({x : a}) - v.y*10);			
			this.cmd('option', r1Id, 'x1', x + v.x * 10);
			this.cmd('option', r1Id, 'y1', expr.evaluate({x : x}) + v.y*10);
			this.cmd('redraw', r1Id);
			this.cmd('step');
		}
		else
		{
			r1Id = this.IdIndex++;
			this.cmd('line', r1Id, a - v.x*10, expr.evaluate({x : a}) - v.y*10, x + v.x * 10, expr.evaluate({x : x}) + v.y*10, 'solid', null, this.graphicsManager.getDefColor(2));
			this.cmd('option', r1Id, 'strokeWidth', 1.2);
			this.cmd('redraw', r1Id);
			this.cmd('step');
		}
		x -= 0.02;
	}
	return this.commands;
}

var currentAlg;

function init()
{
	var gm = new GraphicsManager({
					canvas : 'canvas',
					maxY:12,
					minY:-12,
					maxX: 12,
					minX: -12,
				});
	currentAlg = new Derivada(gm);
}