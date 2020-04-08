"use strict";

Module.register("MMM-Jast", {
  result: {},
  defaults: {
    debug: false,
    updateInterval: 120000,
    fadeSpeed: 2500,
    stocks: [
      { name: "BASF", symbol: "BAS.DE" },
      { name: "SAP", symbol: "SAP.DE" },
      { name: "Henkel", symbol: "HEN3.DE" },
      { name: "Alibaba", symbol: "BABA", tradeCurrency: "USD", displayCurrency: "EUR" },
    ],
    defaultCurrency: "EUR",
    baseURL: "https://www.alphavantage.co/",
    apiKey: "IPWULBT54Y3LHJME",
    scroll: "vertical",
    maxWidth: "300px",
  },

  getStyles: function () {
    return ["MMM-Jast.css"];
  },

  getTranslations: function () {
    return false;
  },

  start: function () {
    this.stockData = {};
    this.exchangeData = {};
    this.getExchangeRate();
    this.getStocks();
    this.scheduleUpdate();
  },

  getDom: function () {
    this.setVerticalScrollingKeyframes();
    let app = document.createElement("div");
    const stockDataArray = Object.entries(this.stockData);
    let ticker = `<div class="ticker-wrap ${
      this.config.scroll === "horizontal" || this.config.scroll === "vertical" ? this.config.scroll : ""
    }" style="max-width: ${this.config.maxWidth}" >`;
    ticker += `<ul style="animation-duration: ${(stockDataArray.length * this.config.fadeSpeed) / 1000}s">`;
    stockDataArray.forEach(([key, value]) => {
      const stock = this.config.stocks.find((stock) => stock.symbol === key);
      if (!stock) return;
      let currentValue = value.current;
      if (stock.tradeCurrency && stock.DisplayCurrency && stock.tradeCurrency !== stock.DisplayCurrency) {
        const exchange = this.exchangeData.find(
          (exchange) => exchange.from === stock.tradeCurrency && exchange.to === stock.displayCurrency
        );
        if (exchange) {
          currentValue = currentValue * exchange.rate;
        }
      }
      const currency = stock.displayCurrency || this.config.defaultCurrency;

      ticker += `<li>${stock.name} `;
      ticker += `<span class=${value.current < value.last ? "low" : "high"}>${currentValue.toFixed(2)} ${currency} (${(
        ((value.current - value.last) / value.last) *
        100
      ).toFixed(1)}%)</span>`;
      ticker += `</li>`;
    });
    ticker += `</ul>`;
    ticker += `</div>`;
    app.innerHTML = ticker;
    return app;
  },

  scheduleUpdate: function () {
    const self = this;
    setInterval(function () {
      self.getExchangeRate();
      self.getStocks();
    }, this.config.updateInterval);
  },

  getStocks: function () {
    this.sendSocketNotification("GET_STOCKS", this.config);
  },

  getExchangeRate: function () {
    this.sendSocketNotification("GET_EXCHANGE", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "STOCK_RESULT") {
      let { symbol, current, last } = payload;
      if (this.config.stocks.find((stock) => stock.symbol === symbol)) {
        this.stockData[symbol] = { current, last };
        this.updateDom();
      }
    } else if (notification === "EXCHANGE_RESULT") {
      let { from, to, rate } = payload;
      this.exchangeData[from + to] = { from, to, rate };
      this.updateDom();
    }
  },

  setVerticalScrollingKeyframes() {
    if (this.config.scroll !== "vertical") return;

    let vkf = document.getElementById("vkf");
    if (!vkf) {
      vkf = document.createElement("style");
      vkf.type = "text/css";
      vkf.setAttribute("id", "vkf");
      document.head.appendChild(vkf);
    }
    let innerText = `@keyframes tickerv {`;
    const itemCount = Object.keys(this.stockData).length > 0 ? Object.keys(this.stockData).length : 1;
    const percentPerItem = 100 / itemCount;
    for (let i = 0; i <= itemCount; i++) {
      innerText += `  ${i * percentPerItem}% { margin-top: ${i == 0 || i == itemCount ? "0" : i * -26 + "px"}; }`;
    }
    innerText += `}`;
    vkf.innerText = innerText;
  },
});
