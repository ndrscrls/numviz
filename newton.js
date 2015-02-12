function Newton(gm)
{
	this.init(gm);
}

Newton.prototype = new Algorithm();
Newton.prototype.constructor = Newton;
Newton.superclass = Algorithm.prototype;


Newton.prototype.init = function(gm)
{
	Newton.superclass.init.call(this, gm);
	
	this.addControls();
}

Newton.prototype.addControls =  function()
{
	this.functionLabel = this.addLabelToAlgorithmBar("f(x) = ");
    this.functionField = this.addControlToAlgorithmBar("Text", "", "x^2 - 5", true);

	this.x0Label = this.addLabelToAlgorithmBar("p0 = ");
    this.x0Field = this.addControlToAlgorithmBar("Text", "", "4", true, 4);

	this.startLabel = this.addLabelToAlgorithmBar("a = ");
    this.startField = this.addControlToAlgorithmBar("Text", "", "-2", true, 4);

	this.endLabel = this.addLabelToAlgorithmBar("b = ");
    this.endField = this.addControlToAlgorithmBar("Text", "", "6", true, 4);

	this.toleranciaLabel = this.addLabelToAlgorithmBar("Tolerancia");
    this.toleranciaField = this.addControlToAlgorithmBar("Text", "", "0.01", true, 4);

	this.deltaLabel = this.addLabelToAlgorithmBar("delta");
    this.deltaField = this.addControlToAlgorithmBar("Text", "", "2.5", true, 4);

	this.comenzarButton = this.addControlToAlgorithmBar("Button", "", "Comenzar", true);
	this.comenzarButton.onclick = this.comenzarCallback.bind(this);
}

Newton.prototype.comenzarCallback = function()
{
	this.reset();
	this.func = this.functionField.value;
	this.delta = Number(this.deltaField.value);
	this.x0 = Number(this.x0Field.value);
	this.start = Number(this.startField.value);
	this.end = Number(this.endField.value);
	this.tolerancia = Number(this.toleranciaField.value);
	this.implementAction(this.run.bind(this), "");	
}

Newton.prototype.adjustGraph = function(x0, f_x0, step){
	this.cmd('gm_option', 'minX', x0 - this.delta);
	this.cmd('gm_option', 'maxX', x0 + this.delta);
	this.cmd('gm_option', 'minY', -Math.abs(f_x0) - 2*this.delta);
	this.cmd('gm_option', 'maxY', Math.abs(f_x0) + 2*this.delta);	
	this.cmd('gm_option', 'stepX', step);
	this.cmd('gm_option', 'stepY', step);
	this.cmd('gm_redraw');
};

Newton.prototype.dimLine = function(id){
	this.cmd('option', id, 'stroke', '#efd384');
	this.cmd('option', id, 'strokeWidth', 1.2);
	this.cmd('option', id, 'animate', false);
	this.cmd('redraw', id);
};

Newton.prototype.run = function()
{
	this.commands = [];
	var x2 = 0,
		x0, x1, r1Id, xCount, step, pXi, f_x0, f_x1;
	var f = Parser.parse(this.func);
	var N0 = 50;

	xCount = 0;
	this.IdIndex = 1;
	step = 2;
	x0 = this.x0;
	x1 = x0;
	f_x0 = f.evaluate({x : x0});
	//Ajustando el gráfico, centrándolo donde nos interesa y fijando los espacios de la cuadrícula
	this.adjustGraph(x0, f_x0, step);
	this.cmd('plot', this.IdIndex++, this.func, this.start, this.end, this.functionField.value);
	this.cmd('step');

	this.cmd('set_step', 0);
	this.cmd('point', this.IdIndex++, x0, 0, 'diamond', 'x' + xCount);
	this.cmd('line', this.IdIndex++, x0, 0, x0, f_x0, 'dashed', null, this.graphicsManager.getDefColor(2));
	this.cmd('step');

	this.cmd('point', this.IdIndex++, x0, f_x0, 'diamond', 'f(x' + xCount + ')');
	this.cmd('step');
	f_x1 = f_x0;

	while (Math.abs(f_x1) > this.tolerancia && xCount < N0)
	{
		r1Id = this.IdIndex++;
		f_x0 = f.evaluate({x : x0});
		xCount++;
		this.cmd('set_step', 1);
		this.cmd('tanvectorx', r1Id, this.func, x0, f_x0, 'solid', null, this.graphicsManager.getDefColor(3));
		this.cmd('step');

		this.cmd('remove', r1Id);
		this.cmd('tanx', r1Id, this.func, x0, f_x0, 'solid', null, this.graphicsManager.getDefColor(3));
		this.cmd('step');

		x1 = x0 - (f_x0/this.graphicsManager.derivative(this.func, x0));
		f_x1 = f.evaluate({x : x1});
		pXi = this.IdIndex++;
		this.cmd('set_step', 2);
		this.cmd('point', pXi, x1, 0, 'diamond', 'x' + xCount + ' = ' + 'x' + (xCount - 1) + ' - f(x' + (xCount - 1) + ')/f\'(x' + (xCount - 1) +')');
		this.cmd('highlight', pXi);
		this.cmd('line', this.IdIndex++, x1, 0, x1, f_x1, 'dashed', '|f(x)|', this.graphicsManager.getDefColor(2));
		this.cmd('step');

		this.cmd('point', this.IdIndex++, x1, f_x1, 'diamond', 'f(x'+xCount+')');
		this.cmd('step');

		this.cmd('set_step', 3);
		this.dimLine(r1Id);
		this.cmd('step');
		x0 = x1;
		step = step / 1.3;
		this.delta = this.delta / 1.3;
		if (Math.abs(f_x1) > this.tolerancia)
			this.cmd('set_step', 0);
		else
			this.cmd('set_step', null);

		this.adjustGraph(x1, f_x1, step);
		this.cmd('step');
	}
	this.cmd('tooltip', "Resultado: " + round3decimales(x1));
	this.cmd('step');	
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
	currentAlg = new Newton(gm);
}