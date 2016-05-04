(function ($, Morris) {
    var SerialPort = require('serialport').SerialPort;

    var NWGui = require('nw.gui');
    var NWWindow = NWGui.Window.get();

    /**
     * private class DummyDevice
     *
     * Classe usada para simular o dispositivo. Apenas para testes
     **/
    var DummyDevice = (function () {
        var DummyDevice = new Function();

        DummyDevice.prototype.topExternalTemperature = 45;
        DummyDevice.prototype.bottomExternalTemperature = -10;

        DummyDevice.prototype.topWaterTemperature = 50;
        DummyDevice.prototype.bottomWaterTemperature = -5;

        DummyDevice.prototype.topLuminosity = 700;
        DummyDevice.prototype.bottomLuminosity = 50;

        DummyDevice.prototype.externalTemperature = undefined;
        DummyDevice.prototype.waterTemperature = undefined;
        DummyDevice.prototype.luminosity = undefined;

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

            if ( ! this.externalTemperature) {
                this.externalTemperature = rand(this.bottomExternalTemperature, this.topExternalTemperature);
            }

            if ( ! this.waterTemperature) {
                this.waterTemperature = rand(this.bottomWaterTemperature, this.topWaterTemperature);
            }

            if ( ! this.luminosity ) {
                this.luminosity = rand(this.bottomLuminosity, this.topLuminosity);
            }

            this.externalTemperature += Math.random() > 0.5 ? Math.random() : -1 * Math.random();
            this.waterTemperature += Math.random() > 0.5 ? Math.random() : -1 * Math.random();
            this.luminosity += Math.random() > 0.5 ? Math.random() : -1 * Math.random();

            signal += "TE:" + this.externalTemperature.toPrecision(4) + ";";
            signal += "TA:" + this.waterTemperature.toPrecision(4) + ";";
            signal += "LU:" + this.luminosity.toPrecision(4) + ";";

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

    var DeviceSettingsModalWidget = (function () {
        var DeviceSettingsModalWidget = new Function();

        DeviceSettingsModalWidget.prototype.dom = $("#DeviceSettingsModalWidget");

        DeviceSettingsModalWidget.prototype.saveBtn = $("#DeviceSettingsModalWidget-SaveBtn");

        DeviceSettingsModalWidget.prototype.ID = $("#DeviceSettingsModalWidget-ID");
        DeviceSettingsModalWidget.prototype.serialPort = $("#DeviceSettingsModalWidget-SerialPort");
        DeviceSettingsModalWidget.prototype.baudRate = $("#DeviceSettingsModalWidget-BaudRate");

        DeviceSettingsModalWidget.prototype.TE = $("#DeviceSettingsModalWidget-TE");
        DeviceSettingsModalWidget.prototype.TA = $("#DeviceSettingsModalWidget-TA");
        DeviceSettingsModalWidget.prototype.LU = $("#DeviceSettingsModalWidget-LU");

        DeviceSettingsModalWidget.prototype.show = function () {
            this.dom.modal('show');
        };
        
        return DeviceSettingsModalWidget;
    }());

    var MainNavbarWidget = (function () {
        var MainNavbarWidget = new Function();

        MainNavbarWidget.prototype.dom = $("#MainNavbarWidget");
        
        MainNavbarWidget.prototype.configDeviceBtn = $("#ConfigDeviceBtn");

        
        return MainNavbarWidget;
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

        MainPlotPanelWidget.prototype.MAX_DATA_LENGTH = 15;

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

            if (this.graphs[graphName].length > this.MAX_DATA_LENGTH) {
                this.graphs[graphName].splice(0, this.graphs[graphName].length - this.MAX_DATA_LENGTH);
            }
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

    var SensorSignalSender = (function () {
        var SensorSignalSender = new Function();

        SensorSignalSender.prototype.sensorID = undefined;
        SensorSignalSender.prototype.hostURL = undefined;

        SensorSignalSender.prototype.sensorSignal = undefined;

        SensorSignalSender.prototype.requestDoneCounter = 0;
        SensorSignalSender.prototype.requestSuccessCounter = 0;
        SensorSignalSender.prototype.requestFailedCounter = 0;

        SensorSignalSender.prototype.init = function (sensor_id, host) {
            this.sensorID = sensor_id;
            this.hostURL = host;
        };

        SensorSignalSender.prototype.update = function (sensorSignal) {
            this.sensorSignal = sensorSignal;
        };

        SensorSignalSender.prototype.send = function () {
            var signal, post;

            signal = this.sensorSignal.to_json();
            signal["sensor"] = this.sensorID;

            post = $.ajax({
                url: this.hostURL + "/SensorSignal/create",
                method: "POST",
                dataType: "json",
                data: signal
            });

            post.error(function () {
                this.requestFailedCounter += 1;
            });

            post.success(function () {
                this.requestSuccessCounter += 1;
            });

            post.done(function () {
                this.requestDoneCounter += 1;
            });
        };

        return SensorSignalSender;
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

        SensorSignal.prototype.to_json = function () {
            var json = {};

            json["ext_temp"] = this.externalTemperature;
            json["water_temp"] = this.waterTemperature;
            json["luminosity"] = this.luminosity;

            return json;
        };

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
     * private class SerialPortListener
     *
     * Classe responsável por escutar a porta serial.
     * */
    var SerialPortListener = (function () {
        var SerialPortListener = new Function();

        // Constantes de configuração do serialport
        SerialPortListener.prototype.SERIAL_PORT = undefined;
        SerialPortListener.prototype.BAUD_RATE = undefined;

        // Instância da serialport.SerialPort
        SerialPortListener.prototype.serialPort = undefined;

        /**
         * public method onOpen
         *
         * Atribui uma função ao evento open do serialport
         * */
        SerialPortListener.prototype.onOpen = function (ctx, callback) {
            this.serialPort.on('open', function (err) {
                callback.call(ctx, err);
            });
        };

        /**
         * public method onClose
         *
         * Atribui uma função ao evento close do serialport
         * */
        SerialPortListener.prototype.onClose = function (ctx, callback) {
            this.serialPort.on('close', function (err) {
                callback.call(ctx, err);
            });
        };

        /**
         * public method onData
         *
         * Atribui uma função ao evento data do serialport
         * */
        SerialPortListener.prototype.onData = function (ctx, callback) {
            this.serialPort.on('data', function (data) {
                callback.call(ctx, data);
            });
        };

        /**
         * public method init
         *
         * Inicializa o serialport
         * */
        SerialPortListener.prototype.init = function (port, baudrate) {
            var self = this;

            this.serialPort = new SerialPort(port, {
                baudrate: baudrate,
                parser: require('serialport').parsers.readline('\n')
            });
        };

        return SerialPortListener;
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
        WaterSenseApplication.prototype.DEFAULT_BAUD_RATE = 9600;

        // Propriedades da janela
        WaterSenseApplication.prototype.WINDOW_WIDTH = 1024;
        WaterSenseApplication.prototype.WINDOW_HEIGHT = 600;

        // URL do servidor na nuvem
        WaterSenseApplication.prototype.HOST_URL = "http://localhost:1337";

        WaterSenseApplication.prototype.SENSOR_ID = 1;

        // Flag que indetifica se a aplicação está usando o DummyDevice
        WaterSenseApplication.prototype.isUsingDummyDevice = true;

        WaterSenseApplication.prototype.isExternalTemperatureSensorActive = true;
        WaterSenseApplication.prototype.isWaterTemperatureSensorActive = true;
        WaterSenseApplication.prototype.isLuminositySensorActive = true;

        // Medida sendo plotada no momento
        WaterSenseApplication.prototype.plotedMeasurement = "externalTemperature";

        // Objeto da biblioteca serialport
        WaterSenseApplication.prototype.serialPort = undefined;

        // Instâncias dos widgets
        WaterSenseApplication.prototype.lastMeasurementPanel = new LastMeasurementsPanelWidget();
        WaterSenseApplication.prototype.mainPlotPanel = new MainPlotPanelWidget();
        WaterSenseApplication.prototype.deviceSettingsModal = new DeviceSettingsModalWidget();
        WaterSenseApplication.prototype.mainNavbar = new MainNavbarWidget();

        // Instância da classe DummyDevice
        WaterSenseApplication.prototype.dummyDevice = new DummyDevice();

        // Instância da classe SensorSignalSender
        WaterSenseApplication.prototype.sensorSignalSender = new SensorSignalSender();

        // Instância da classe SensorPortListener
        WaterSenseApplication.prototype.serialPortListener = new SerialPortListener();

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
         * private method serialPortListener_Open
         *
         * Evento disparado quando a conexão serial é aberta
         * */
        function serialPortListener_Open (err) {
        };

        /**
         * private method serialPortListener_Close
         *
         * Evento disparado quando a conexão serial é fechada
         * */
        function serialPortListener_Close (err) {
            alert("The serial port connection has been closed");
        };

        /**
         * private method serialPortListener_Data
         *
         * Evento disparado quando um dado é enviado para a porta serial
         * */
        function serialPortListener_Data (data) {
            this.update(data);
        };

        function configDeviceBtn_Click () {
            this.deviceSettingsModal.show();
        };
        
        /**
         * public method update
         *
         * Atualiza os widgets da aplicação
         * */
        WaterSenseApplication.prototype.update = function (raw_signal) {
            var signal = new SensorSignal();

            if (this.isUsingDummyDevice) {
                signal.digestSignal(this.dummyDevice.getSignal());
            } else {
                signal.digestSignal(raw_signal);
            }

            this.sensorSignalSender.update(signal);
            this.sensorSignalSender.send();

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

            this.sensorSignalSender.init(this.SENSOR_ID, this.HOST_URL);

            this.mainPlotPanel.start();

            // Inicializa um gráfico para cada medida
            this.mainPlotPanel.initGraph("externalTemperature");
            this.mainPlotPanel.initGraph("waterTemperature");
            this.mainPlotPanel.initGraph("luminosity");

            this.deviceSettingsModal.ID.val(this.SENSOR_ID);

            this.deviceSettingsModal.baudRate.val(this.DEFAULT_BAUD_RATE);
            this.deviceSettingsModal.serialPort.val(this.DEFAULT_SERIAL_PORT);

            if (this.isExternalTemperatureSensorActive) {
                this.deviceSettingsModal.TE.prop('checked', true);
            }

            if (this.isWaterTemperatureSensorActive) {
                this.deviceSettingsModal.TA.prop('checked', true);
            }

            if (this.isLuminositySensorActive) {
                this.deviceSettingsModal.LU.prop('checked', true);
            }

            // Defini eventos ao botões do lastMeasurementPanel
            this.lastMeasurementPanel.plotExternalTemperatureBtn.on('click', function () {
                plotExternalTemperatureBtn_Click.call(self);
            });

            this.lastMeasurementPanel.plotWaterTemperatureBtn.on('click', function () {
                plotWaterTemperatureBtn_Click.call(self);
            });

            this.lastMeasurementPanel.plotLuminosityBtn.on('click', function () {
                plotLuminosityBtn_Click.call(self);
            });
            
            this.mainNavbar.configDeviceBtn.on('click', function () {
                configDeviceBtn_Click.call(self);
            });

            if (this.isUsingDummyDevice) {
                window.setInterval(function () {
                    self.update("");
                }, 1000);
            } else {
                this.serialPortListener.init(this.DEFAULT_SERIAL_PORT, this.DEFAULT_BAUD_RATE);

                // Defini os eventos do serialPortListener
                this.serialPortListener.onOpen(self, serialPortListener_Open);
                this.serialPortListener.onClose(self, serialPortListener_Close);
                this.serialPortListener.onData(self, serialPortListener_Data);
            }
        };

        return WaterSenseApplication;
    }());

    var App = new WaterSenseApplication();

    App.main();
}).call(this, jQuery, Morris);