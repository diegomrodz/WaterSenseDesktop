# Water Sense

Arquitetura de Software Web para monitoramento e controle de aspectos físico-químicos através de métodos estatísticos, com intuito de notificar e conscientizar a comunidade ou pessoas interessadas na situação de qualidade d’água do corpo hídrico sob medição. Incluindo a geração de relatórios segundo legislações e índices do CONAMA, Ministério da Saúde, CETESB e Governo do Estado de São Paulo. Além da entrega de um dispositivo Arduino para prova de conceito da arquitetura.

Acesse a versão 1.0.0 do projeto através do link: [water-sense.herokuapp.com](http://water-sense.herokuapp.com)

## Desktop (Software Receptor)

Repositório com o código do software receptor, parte intermediária da arquitetura. Faz o recebimento das leituras, conversão para json e envio para o servidor.

## Instruções

Clone o repositório no seu pc e depois rode o comando

```
npm install
```

Verifique se o programa rodou corretamente. Se não, boa sorte em achar o conflito, xD.

Dica: a biblioteca nodeserialport pode exigir re-compilação

## TODO

- ~~Criar interface gráfica~~
- ~~~Ler porta serial~~
- ~~Gráficos das medições~~~
- ~~Enviar dados ao servidor~~
- Tela de configuração dos sensores (50%)
- Tela de configuração do servidor

## Desenvolvedor

Este projeto foi desenvolvido por Diego Rodrigues <[diego.mrodrigues@outlook.com](mailto:diego.mrodrigues@outlook.com)>, aluno do Bacharelado em Engenharia da Computação no Senac São Paulo.
