(function ($, Morris) {
    //var SerialPort = require('serialport').SerialPort;

    var NWGui = require('nw.gui');
    var NWWindow = NWGui.Window.get();

    /**
     * private class DummyDevice
     *
     * Classe usada para simular o dispositivo. Apenas para testes
     **/
    var DummyDevice = (function () {
        var DummyDevice = new Function();

        /**
         * private function rand
         *
         * Gera um número aleatório entre a e b
         * */
        function rand(a, b) {
            return (Math.random() * a) + b;
        }

        /**
         * public method getSignal
         *
         * Gera um sinal no formato lido pelo o dispositivo
         * */
        DummyDevice.prototype.getSignal = function () {
            var signal = "";

            signal += "TE:" + rand(20, 35).toPrecision(4) + ";";
            signal += "TA:" + rand(15, 30).toPrecision(4) + ";";
            signal += "LU:" + rand(120, 450).toPrecision(4) + ";";

            return signal;
        };

        return DummyDevice;
    }());

    /**
     * private class LastMeasurementPanelWideget
     *
     * Widget reponsável por mostrar as informações em tempo-real na tela
     * inicial da aplicação.
     * */
    var LastMeasurementsPanelWidget = (function () {
        var LastMeasurementsPanelWidget = new Function();

        // O elemento html do widget
        LastMeasurementsPanelWidget.prototype.dom = $("#LastMeasurementsPanel");

        // Os elementos html de cada medida exibida no painel
        LastMeasurementsPanelWidget.prototype.externalTemperature = $("#LastMeasurementsPanel-ExternalTemperatureLabel");
        LastMeasurementsPanelWidget.prototype.waterTemperature = $("#LastMeasurementsPanel-WaterTemperatureLabel");
        LastMeasurementsPanelWidget.prototype.luminosity = $("#LastMeasurementsPanel-LuminosityLabel");

        // Os elementos html dos botões que atualizam o gráfico com a medida selecionada
        LastMeasurementsPanelWidget.prototype.plotExternalTemperatureBtn = $("#LastMeasurementsPanel-PlotExternalTemperatureBtn");
        LastMeasurementsPanelWidget.prototype.plotWaterTemperatureBtn = $("#LastMeasurementsPanel-PlotWaterTemperatureBtn");
        LastMeasurementsPanelWidget.prototype.plotLuminosityBtn = $("#LastMeasurementsPanel-PlotLuminosityBtn");

        /**
         * public method updataExternalTemperature
         *
         * Atualiza a medição da temperatura externa no painel
         * */
        LastMeasurementsPanelWidget.prototype.updateExternalTemperature = function (temperature) {
            this.externalTemperature.text("Última Medição: " + temperature + "ºC");
        };

        /**
         * public method updataWaterTemperature
         *
         * Atualiza a medição da temperatura da água no painel
         * */
        LastMeasurementsPanelWidget.prototype.updateWaterTemperature = function (temperature) {
            this.waterTemperature.text("Última Medição: " + temperature + "ºC");
        };

        /**
         * public method updataLuminosity
         *
         * Atualiza a medição da luminosidade no painel
         * */
        LastMeasurementsPanelWidget.prototype.updateLuminosity = function (luminosity) {
            this.luminosity.text("Última Medição: " + luminosity);
        };

        return LastMeasurementsPanelWidget;
    }());

    /**
     * private class MainPlotWidget
     *
     * Widget responsável por apresentar o gráfico na página inicial da aplicação
     * */
    var MainPlotPanelWidget = (function () {
        var MainPlotPanelWidget = new Function();

        // ID do elemento html da gráfico
        MainPlotPanelWidget.prototype.CHART_ID = "MainPlotChart";

        // Elemento html do gráfico
        MainPlotPanelWidget.prototype.chart = undefined;

        // Array com os dados sendo exibidos no gráfico
        MainPlotPanelWidget.prototype.graphData = [];

        // Objeto com os graficos armazenados
        MainPlotPanelWidget.prototype.graphs = {};

        // Nome do gráfico sendo exibido
        MainPlotPanelWidget.prototype.currentGraph = "";

        /**
         * public method initGraph
         *
         * Inicializa um novo gráfico
         * */
        MainPlotPanelWidget.prototype.initGraph = function (graphName) {
            this.graphs[graphName] = [];
        };

        /**
         * public method start
         *
         * Inicializa o elemento gráfico
         * */
        MainPlotPanelWidget.prototype.start = function () {
            this.chart = new Morris.Line({
                element: this.CHART_ID,
                data: this.graphData,
                xkey: 'timestamp',
                ykeys: ['measurement'],
                labels: ['Value'],
                dateFormat: function (x) {
                    return (new Date(x)).toDateString();
                }
            });
        };

        /**
         * public method insert
         *
         * Insere um novo dado no gráfico selecionado
         * */
        MainPlotPanelWidget.prototype.insert = function (graphName, value) {
            this.graphs[graphName].push({
                "measurement" : value,
                "timestamp" : (new Date()).getTime()
            });
        };

        /**
         * public method update
         *
         * Atualiza o widget
         * */
        MainPlotPanelWidget.prototype.update = function () {
            this.chart.setData(this.graphs[this.currentGraph]);
        };

        return MainPlotPanelWidget;
    }());

    /**
     * private class SensorSignal
     *
     * Classe responsável por carregar os dados lidos do dispositivo.
     * */
    var SensorSignal = (function () {
        var SensorSignal = new Function();

        // Indentificadores usados no sinal do dispositivo
        SensorSignal.prototype.CONST_EXT_TEMP_IDENTIFIER = "TE";
        SensorSignal.prototype.CONST_WATER_TEMP_IDENTIFIER = "TA";
        SensorSignal.prototype.CONST_LUMINOSITY_IDENTIFIER = "LU";

        // Variáveis públicas com os dados do sensor
        SensorSignal.prototype.externalTemperature = undefined;
        SensorSignal.prototype.waterTemperature = undefined;
        SensorSignal.prototype.luminosity = undefined;

        /**
         * public method digestSignal
         *
         * Consome o sinal bruto enviado pelo dispositivo
         * */
        SensorSignal.prototype.digestSignal = function (rawSignal) {
            var parts = rawSignal.split(";");
            var i = 0, len = parts.length;

            for (; i < len - 1; i += 1) {
                var aux = parts[i].split(":");

                if (aux[0] === this.CONST_EXT_TEMP_IDENTIFIER) {
                    this.externalTemperature = parseFloat(aux[1]);
                } else if (aux[0] === this.CONST_WATER_TEMP_IDENTIFIER) {
                    this.waterTemperature = parseFloat(aux[1]);
                } else if (aux[0] === this.CONST_LUMINOSITY_IDENTIFIER) {
                    this.luminosity = parseFloat(aux[1]);
                }
            }
        };

        return SensorSignal;
    }());

    /**
     * private class WaterSenseApplication
     *
     * Classe principal da aplicação
     * */
    var WaterSenseApplication = (function () {
        var WaterSenseApplication = new Function();

        // Porta serial lida pela aplicação
        WaterSenseApplication.prototype.DEFAULT_SERIAL_PORT = "COM3";

        // Propriedades da janela
        WaterSenseApplication.prototype.WINDOW_WIDTH = 1024;
        WaterSenseApplication.prototype.WINDOW_HEIGHT = 600;

        // Medida sendo plotada no momento
        WaterSenseApplication.prototype.plotedMeasurement = "externalTemperature";

        // Objeto da biblioteca serialport
        WaterSenseApplication.prototype.serialPort = undefined;

        // Instâncias dos widgets
        WaterSenseApplication.prototype.lastMeasurementPanel = new LastMeasurementsPanelWidget();
        WaterSenseApplication.prototype.mainPlotPanel = new MainPlotPanelWidget();

        // Instância da classe DummyDevice
        WaterSenseApplication.prototype.dummyDevice = new DummyDevice();

        /**
         * private function plotExternalTemperatureBtn_Click
         *
         * Evento disparado quando há um clique no elemento plotExternalTemperatureBtn
         * do objeto lastMeasuremntPanel
         * */
        function plotExternalTemperatureBtn_Click () {
            this.plotedMeasurement = "externalTemperature";
            this.update();
        };

        /**
         * private function plotWaterTemperatureBtn_Click
         *
         * Evento disparado quando há um clique no elemento plotWaterTemperatureBtn
         * do objeto lastMeasuremntPanel
         * */
        function plotWaterTemperatureBtn_Click () {
            this.plotedMeasurement = "waterTemperature";
            this.update();
        };

        /**
         * private function plotLuminosityBtn_Click
         *
         * Evento disparado quando há um clique no elemento plotLuminosityBtn
         * do objeto lastMeasuremntPanel
         * */
        function plotLuminosityBtn_Click () {
            this.plotedMeasurement = "luminosity";
            this.update();
        };

        /**
         * public method update
         *
         * Atualiza os widgets da aplicação
         * */
        WaterSenseApplication.prototype.update = function () {
            var signal = new SensorSignal();

            signal.digestSignal(this.dummyDevice.getSignal());

            // Atualiza dados do painel painel
            this.lastMeasurementPanel.updateExternalTemperature(signal.externalTemperature);
            this.lastMeasurementPanel.updateWaterTemperature(signal.waterTemperature);
            this.lastMeasurementPanel.updateLuminosity(signal.luminosity);

            // Insere os dados lidos no gráfico em tempo-real
            this.mainPlotPanel.insert("externalTemperature", signal.externalTemperature);
            this.mainPlotPanel.insert("waterTemperature", signal.waterTemperature);
            this.mainPlotPanel.insert("luminosity", signal.luminosity);

            this.mainPlotPanel.currentGraph = this.plotedMeasurement;

            this.mainPlotPanel.update();
        };

        /**
         * public method main
         *
         * Método principal da aplicação
         * */
        WaterSenseApplication.prototype.main = function () {
            var self = this;
            //this.serialPort = new SerialPort(this.DEFAULT_SERIAL_PORT);

            NWWindow.width = this.WINDOW_WIDTH;
            NWWindow.height = this.WINDOW_HEIGHT;

            NWWindow.setResizable(false);

            NWWindow.moveTo(0, 0);

            this.mainPlotPanel.start();

            // Inicializa um gráfico para cada medida
            this.mainPlotPanel.initGraph("externalTemperature");
            this.mainPlotPanel.initGraph("waterTemperature");
            this.mainPlotPanel.initGraph("luminosity");

            this.lastMeasurementPanel.plotExternalTemperatureBtn.on('click', function () {
                plotExternalTemperatureBtn_Click.call(self);
            });

            this.lastMeasurementPanel.plotWaterTemperatureBtn.on('click', function () {
                plotWaterTemperatureBtn_Click.call(self);
            });

            this.lastMeasurementPanel.plotLuminosityBtn.on('click', function () {
                plotLuminosityBtn_Click.call(self);
            });

            setInterval(function () {
                self.update();
            }, 2000);
        };

        return WaterSenseApplication;
    }());

    var App = new WaterSenseApplication();

    App.main();
}).call(this, jQuery, Morris);