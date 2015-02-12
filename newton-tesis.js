function Algoritmo1(gm)
{
    this.init(gm);
}

Algoritmo1.prototype = new Algorithm();
Algoritmo1.prototype.constructor = Algoritmo1;
Algoritmo1.superclass = Algorithm.prototype;


Algoritmo1.prototype.init = function(gm)
{
    Algoritmo1.superclass.init.call(this, gm);
    
    this.addControls();
}

Algoritmo1.prototype.addControls =  function()
{
    this.funcionLabel = this.addLabelToAlgorithmBar("f(x) = ");
    this.funcionField = this.addControlToAlgorithmBar("Text", "", "x^2 - 5", true);

    this.p0Label = this.addLabelToAlgorithmBar("p0 = ");
    this.p0Field = this.addControlToAlgorithmBar("Text", "", "4", true, 4);

    this.inicioLabel = this.addLabelToAlgorithmBar("a = ");
    this.inicioField = this.addControlToAlgorithmBar("Text", "", "-2", true, 4);

    this.finLabel = this.addLabelToAlgorithmBar("b = ");
    this.finField = this.addControlToAlgorithmBar("Text", "", "6", true, 4);

    this.toleranciaLabel = this.addLabelToAlgorithmBar("Tolerancia");
    this.toleranciaField = this.addControlToAlgorithmBar("Text", "", "0.01", true, 4);

    this.comenzarButton = this.addControlToAlgorithmBar("Button", "", "Comenzar", true);
    this.comenzarButton.onclick = this.comenzarCallback.bind(this);
}

Algoritmo1.prototype.comenzarCallback = function()
{
    this.reset();
    this.func = this.funcionField.value;
    this.delta = 2.5;
    this.p0 = Number(this.p0Field.value);
    this.inicio = Number(this.inicioField.value);
    this.fin = Number(this.finField.value);
    this.tolerancia = Number(this.toleranciaField.value);
    this.implementAction(this.run.bind(this), "");  
}

Algoritmo1.prototype.adjustGraph = function(p0, f_p0, step){
    this.cmd('gm_option', 'minX', p0 - this.delta);
    this.cmd('gm_option', 'maxX', p0 + this.delta);
    this.cmd('gm_option', 'minY', -Math.abs(f_p0) - 2*this.delta);
    this.cmd('gm_option', 'maxY', Math.abs(f_p0) + 2*this.delta);   
    this.cmd('gm_option', 'stepX', step);
    this.cmd('gm_option', 'stepY', step);
    this.cmd('gm_redraw');
};

Algoritmo1.prototype.dimLine = function(id){
    this.cmd('option', id, 'stroke', '#efd384');
    this.cmd('option', id, 'strokeWidth', 1.2);
    this.cmd('option', id, 'animate', false);
    this.cmd('redraw', id);
};

Algoritmo1.prototype.run = function()
{
    /* Inicialización del listado de comandos */
    this.commands = [];
    
    /* Declaración de variables de la visualización */
    var p0, r1Id, step, pXi, f_p0, N0, n;
        
    /* Inicialización del parser */
    var f = Parser.parse(this.func); 

    /* Inicialización de variables */
    n  = 0;           //Cantidad de valores calculados
    N0 = 50;          //Máximo número de iteraciones
    this.IdIndex = 1; //Identificador del próximo elemento, 
                      //debe comenzar en 1 dado que el 
                      //elemento 0 es el sistema de coordenadas
                      
    step = 2;         //Amplitud de los intervalos del sistema
                      //de coordenadas
    p0 = this.p0;     //Aproximación inicial
    
    /* Evaluación de la función en p0 utilizando el parser */
    f_p0 = f.evaluate({x : p0}); 
    
    /* Ajuste del gráfico para centrarlo en la zona
    de interés */
    this.adjustGraph(p0, f_p0, step); 
    /* Graficar la función */
    this.cmd('plot', this.IdIndex++, this.func, this.inicio, this.fin, this.funcionField.value);
    this.cmd('step');

    while (Math.abs(f_p0) > this.tolerancia && n < N0)
    {
        /* Evaluar la función en p0 */
        f_p0 = f.evaluate({x : p0}); 
        /* Guardar en pXi la referencia al Id actual */
        pXi = this.IdIndex++;
        /* Resaltar el paso 0 en los pasos de la derecha del sistema de coordenadas */
        this.cmd('set_step', 0);
        /* Trazar el punto (p0, f(p0)), asignándole
        el Id = pXi */
        this.cmd('point', pXi, p0, 0, 'diamond', n > 0 ?
                 'x' + n + ' = ' + 'x' + (n - 1) +
                 ' - f(x' + (n - 1) + ')/f\'(x' + 
                 (n - 1) +')':'p0');
        /* Resaltar el punto recién creado */
        this.cmd('highlight', pXi);
        /* Trazar una línea de (p0, 0) a (p0, f(p0)) */
        this.cmd('line', this.IdIndex++, p0, 0, p0, f_p0, 
                 'dashed', '|f(x)|',
                 this.graphicsManager.getDefColor(2));
        this.cmd('step');
        /* Dibujar el punto (p0, f(p0)) */
        this.cmd('point', this.IdIndex++, p0, f_p0, 'diamond', 'f(x'+n+')');
        this.cmd('step');
        /* Guardar el Id actual e incrementar el contador */
        r1Id = this.IdIndex++;
        /* Resaltar el paso 1 en los pasos de la derecha del sistema de coordenadas. */
        this.cmd('set_step', 1);
        /* Trazar el vector tangente a f en el punto 
        (p0, f(p0)) y asignarle Id = r1Id */
        this.cmd('tanvectorx', r1Id, this.func, p0, f_p0, 
                 'solid', null,
                 this.graphicsManager.getDefColor(3));
        this.cmd('step');
        /* Eliminar el vector tangente dibujado en el paso anterior */
        this.cmd('remove', r1Id);
        /* Trazar la tangente a f desde el punto (p0, f(p0))
        hasta su intercepción con el eje X, y asignarle
        Id = r1Id */
        this.cmd('tanx', r1Id, this.func, p0, f_p0, 'solid', null, this.graphicsManager.getDefColor(3));
        this.cmd('step');
        /* Paso de la iteración para calcular el nuevo p0 */
        p0 = p0 - (f_p0/this.graphicsManager.derivative(this.func, p0));
        /* Resaltar el paso 2 en los pasos de la derecha del sistema de coordenadas */
        this.cmd('set_step', 2);
        /* Opacar la tangente trazada en el paso anterior */
        this.dimLine(r1Id);
        this.cmd('step');
        /* Disminuir la amplitud de los intervalos en el sistema de coordenadas */
        step = step / 1.3;
        /* Disminuir el margen para graficar */
        this.delta = this.delta / 1.5;
        /* Ajustar el gráfico centrado en el nuevo p0 */
        this.adjustGraph(p0, f_p0, step);
        /* Resaltar el paso 3 en los pasos de la derecha del sistema de coordenadas */
        this.cmd('set_step', 3);
        this.cmd('step');       
        /* Aumentar el contador de valores de x calculados */
        n++;
    }
    /* No resaltar ningún paso a la derecha del sistema de coordenadas */
    this.cmd('set_step', null);
    /* Mostrar el resultado del método */
    this.cmd('tooltip', "Resultado: " + round3decimales(p0));
    this.cmd('step');   
    /* Devolver el listado de comandos de la visualización */
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
    currentAlg = new Algoritmo1(gm);
}