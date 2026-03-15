/**
 * Major stock index constituents (static lists, updated periodically)
 * Tickers with .MC suffix = Madrid Stock Exchange (BME)
 * FMP supports these non-US tickers via their search and profile endpoints
 */

export const INDICES = {
  'S&P 500': {
    description: 'US Large Cap',
    exchange: 'NYSE / NASDAQ',
    tickers: [
      'AAPL','ABBV','ABT','ACN','ADBE','ADI','ADM','ADP','ADSK','AEE','AEP','AES','AFL','AIG','AIZ',
      'AJG','AKAM','ALB','ALGN','ALK','ALL','ALLE','AMAT','AMCR','AMD','AME','AMGN','AMP','AMT','AMZN',
      'ANET','ANSS','AON','AOS','APA','APD','APH','APTV','ARE','ATO','ATVI','AVB','AVGO','AVY','AWK',
      'AXP','AZO','BA','BAC','BAX','BBWI','BBY','BDX','BEN','BF.B','BIIB','BIO','BK','BKNG','BKR',
      'BLK','BMY','BR','BRK.B','BRO','BSX','BWA','BXP','C','CAG','CAH','CARR','CAT','CB','CBOE',
      'CBRE','CCI','CCL','CDAY','CDNS','CDW','CE','CEG','CF','CFG','CHD','CHRW','CHTR','CI','CINF',
      'CL','CLX','CMA','CMCSA','CME','CMG','CMI','CMS','CNC','CNP','COF','COO','COP','COST','CPB',
      'CPRT','CPT','CRL','CRM','CSCO','CSGP','CSX','CTAS','CTLT','CTRA','CTSH','CTVA','CVS','CVX',
      'CZR','D','DAL','DD','DE','DFS','DG','DGX','DHI','DHR','DIS','DISH','DLR','DLTR','DOV',
      'DOW','DPZ','DRI','DTE','DUK','DVA','DVN','DXC','DXCM','EA','EBAY','ECL','ED','EFX','EIX',
      'EL','EMN','EMR','ENPH','EOG','EPAM','EQIX','EQR','EQT','ES','ESS','ETN','ETR','ETSY','EVRG',
      'EW','EXC','EXPD','EXPE','EXR','F','FANG','FAST','FBHS','FCX','FDS','FDX','FE','FFIV','FIS',
      'FISV','FITB','FLT','FMC','FOX','FOXA','FRC','FRT','FTNT','FTV','GD','GE','GILD','GIS','GL',
      'GLW','GM','GNRC','GOOG','GOOGL','GPC','GPN','GRMN','GS','GWW','HAL','HAS','HBAN','HCA','HD',
      'HOLX','HON','HPE','HPQ','HRL','HSIC','HST','HSY','HUM','HWM','IBM','ICE','IDXX','IEX','IFF',
      'ILMN','INCY','INTC','INTU','INVH','IP','IPG','IQV','IR','IRM','ISRG','IT','ITW','IVZ','J',
      'JBHT','JCI','JKHY','JNJ','JNPR','JPM','K','KDP','KEY','KEYS','KHC','KIM','KLAC','KMB','KMI',
      'KMX','KO','KR','L','LDOS','LEN','LH','LHX','LIN','LKQ','LLY','LMT','LNC','LNT','LOW',
      'LRCX','LUMN','LUV','LVS','LW','LYB','LYV','MA','MAA','MAR','MAS','MCD','MCHP','MCK','MCO',
      'MDLZ','MDT','MET','META','MGM','MHK','MKC','MKTX','MLM','MMC','MMM','MNST','MO','MOH','MOS',
      'MPC','MPWR','MRK','MRNA','MRO','MS','MSCI','MSFT','MSI','MTB','MTCH','MTD','MU','NCLH','NDAQ',
      'NDSN','NEE','NEM','NFLX','NI','NKE','NOC','NOW','NRG','NSC','NTAP','NTRS','NUE','NVDA','NVR',
      'NWL','NWS','NWSA','NXPI','O','ODFL','OGN','OKE','OMC','ON','ORCL','ORLY','OTIS','OXY','PARA',
      'PAYC','PAYX','PCAR','PCG','PEAK','PEG','PEP','PFE','PFG','PG','PGR','PH','PHM','PKG','PKI',
      'PLD','PM','PNC','PNR','PNW','POOL','PPG','PPL','PRU','PSA','PSX','PTC','PVH','PWR','PXD',
      'PYPL','QCOM','QRVO','RCL','RE','REG','REGN','RF','RHI','RJF','RL','RMD','ROK','ROL','ROP',
      'ROST','RSG','RTX','SBAC','SBNY','SBUX','SCHW','SEE','SHW','SIVB','SJM','SLB','SNA','SNPS',
      'SO','SPG','SPGI','SRE','STE','STT','STX','STZ','SWK','SWKS','SYF','SYK','SYY','T','TAP',
      'TDG','TDY','TECH','TEL','TER','TFC','TFX','TGT','TMO','TMUS','TPR','TRGP','TRMB','TROW',
      'TRV','TSCO','TSLA','TSN','TT','TTWO','TXN','TXT','TYL','UAL','UDR','UHS','ULTA','UNH',
      'UNP','UPS','URI','USB','V','VFC','VICI','VLO','VMC','VNO','VRSK','VRSN','VRTX','VTR',
      'VTRS','VZ','WAB','WAT','WBA','WBD','WDC','WEC','WELL','WFC','WHR','WM','WMB','WMT',
      'WRB','WRK','WST','WTW','WY','WYNN','XEL','XOM','XRAY','XYL','YUM','ZBH','ZBRA','ZION','ZTS'
    ],
  },
  'NASDAQ 100': {
    description: 'US Tech & Growth',
    exchange: 'NASDAQ',
    tickers: [
      'AAPL','ABNB','ADBE','ADI','ADP','ADSK','AEP','AMAT','AMD','AMGN','AMZN','ANSS','ARM',
      'ASML','AVGO','AZN','BIIB','BKNG','BKR','CCEP','CDNS','CDW','CEG','CHTR','CMCSA','COST',
      'CPRT','CRWD','CSCO','CSGP','CSX','CTAS','CTSH','DASH','DDOG','DLTR','DXCM','EA','EXC',
      'FANG','FAST','FTNT','GEHC','GFS','GILD','GOOG','GOOGL','HON','IDXX','ILMN','INTC','INTU',
      'ISRG','KDP','KHC','KLAC','LIN','LRCX','LULU','MAR','MCHP','MDB','MDLZ','MELI','META',
      'MNST','MRNA','MRVL','MSFT','MU','NFLX','NVDA','NXPI','ODFL','ON','ORLY','PANW','PAYX',
      'PCAR','PDD','PEP','PYPL','QCOM','REGN','ROP','ROST','SBUX','SNPS','SPLK','TEAM','TMUS',
      'TSLA','TTD','TTWO','TXN','VRSK','VRTX','WBA','WBD','WDAY','XEL','ZS'
    ],
  },
  'IBEX 35': {
    description: 'Espana - Principales',
    exchange: 'BME (Madrid)',
    tickers: [
      'ITX.MC','SAN.MC','BBVA.MC','IBE.MC','TEF.MC','AMS.MC','FER.MC','REP.MC','CABK.MC',
      'IAG.MC','ACS.MC','ENG.MC','GRF.MC','MAP.MC','RED.MC','CLNX.MC','FDR.MC','MEL.MC',
      'ACX.MC','SAB.MC','BKT.MC','COL.MC','LOG.MC','SCYR.MC','PHM.MC','ROVI.MC','UNI.MC',
      'MRL.MC','AENA.MC','CIE.MC','SOL.MC','SLR.MC','MTS.MC','SGRE.MC','VIS.MC'
    ],
  },
  'Euro Stoxx 50': {
    description: 'Eurozone Blue Chips',
    exchange: 'Multiple EU',
    tickers: [
      'ASML','SAP','LVMH.PA','TTE.PA','SIE.DE','AIR.PA','SAN.PA','DTE.DE','BNP.PA','AI.PA',
      'SU.PA','CS.PA','DG.PA','BAS.DE','BAYN.DE','MUV2.DE','OR.PA','MC.PA','RMS.PA','EL.PA',
      'ABI.BR','INGA.AS','PHIA.AS','KER.PA','ALV.DE','ENEL.MI','ISP.MI','ENI.MI','NOKIA.HE',
      'BBVA.MC','SAN.MC','IBE.MC','ITX.MC','ADS.DE','BMW.DE','VOW3.DE','MBG.DE','IFX.DE',
      'RWE.DE','HEN3.DE','FRE.DE','SAF.PA','VIV.PA','BN.PA','RI.PA','STLAM.MI','UCG.MI',
      'CRG.IR','FLTR.IR','ADP.PA'
    ],
  },
  'DOW 30': {
    description: 'US Industrial Leaders',
    exchange: 'NYSE / NASDAQ',
    tickers: [
      'AAPL','AMGN','AMZN','AXP','BA','CAT','CRM','CSCO','CVX','DIS','DOW','GS','HD','HON',
      'IBM','INTC','JNJ','JPM','KO','MCD','MMM','MRK','MSFT','NKE','PG','SHW','TRV','UNH',
      'V','VZ','WMT'
    ],
  },
  'DAX 40': {
    description: 'Alemania',
    exchange: 'XETRA',
    tickers: [
      'SAP.DE','SIE.DE','DTE.DE','ALV.DE','MUV2.DE','BAS.DE','BAYN.DE','ADS.DE','BMW.DE',
      'VOW3.DE','MBG.DE','IFX.DE','RWE.DE','HEN3.DE','FRE.DE','DB1.DE','DBK.DE','DPW.DE',
      'FME.DE','HEI.DE','LIN.DE','MTX.DE','SHL.DE','SY1.DE','VNA.DE','ZAL.DE','PUM.DE',
      'QIA.DE','RHM.DE','BEI.DE','CON.DE','ENR.DE','HAG.DE','HNR1.DE','AIR.PA','SRT3.DE',
      'DTG.DE','1COV.DE','PAH3.DE','MRK.DE'
    ],
  },
  'CAC 40': {
    description: 'Francia',
    exchange: 'Euronext Paris',
    tickers: [
      'LVMH.PA','TTE.PA','SAN.PA','AIR.PA','AI.PA','SU.PA','CS.PA','DG.PA','BNP.PA','OR.PA',
      'MC.PA','RMS.PA','EL.PA','KER.PA','SAF.PA','VIV.PA','BN.PA','RI.PA','ADP.PA','CA.PA',
      'ML.PA','SGO.PA','CAP.PA','GLE.PA','ACA.PA','EN.PA','ORA.PA','STM.PA','PUB.PA',
      'URW.AS','WLN.PA','HO.PA','DSY.PA','STLAM.MI','LR.PA','RNO.PA','MT.AS','ALO.PA',
      'VIE.PA','TEP.PA'
    ],
  },
  'FTSE 100': {
    description: 'UK Blue Chips',
    exchange: 'LSE',
    tickers: [
      'AZN.L','SHEL.L','HSBA.L','ULVR.L','BP.L','GSK.L','RIO.L','LSEG.L','DGE.L','REL.L',
      'BATS.L','GLEN.L','AAL.L','NG.L','VOD.L','BA.L','CPG.L','RKT.L','PRU.L','LLOY.L',
      'BARC.L','STAN.L','TSCO.L','BT.A.L','IMB.L','SSE.L','NWG.L','ABF.L','ANTO.L','PSON.L',
      'EXPN.L','III.L','SGE.L','LGEN.L','AHT.L','AVV.L','BDEV.L','CNA.L','CRH.L','CRDA.L',
      'DCC.L','EMG.L','FERG.L','FLTR.L','HLMA.L','HRGV.L','ICP.L','IHG.L','INF.L','JD.L',
      'KGF.L','LAND.L','MNG.L','MNDI.L','MRO.L','NXT.L','OCDO.L','PHNX.L','PSN.L','RMV.L',
      'RS1.L','RTO.L','SBRY.L','SDR.L','SGRO.L','SKG.L','SMDS.L','SMIN.L','SMT.L','SN.L',
      'SPX.L','SVT.L','TCIG.L','TW.L','WEIR.L','WPP.L','WTB.L'
    ],
  },
  'Nikkei 225': {
    description: 'Japón - Principales',
    exchange: 'TSE (Tokio)',
    tickers: [
      '7203.T','6758.T','9984.T','8306.T','6861.T','6501.T','7267.T','9432.T','6902.T','4063.T',
      '6098.T','8035.T','6367.T','7741.T','4502.T','4503.T','6954.T','6981.T','8766.T','8001.T',
      '9433.T','6752.T','7751.T','3382.T','4661.T','2802.T','7974.T','6326.T','4568.T','8031.T',
      '9020.T','8058.T','2914.T','4901.T','6702.T','8316.T','5401.T','7269.T','6301.T','8411.T',
      '4519.T','6594.T','8830.T','9022.T','6503.T','7832.T','3407.T','4452.T','6762.T','7733.T'
    ],
  },
}

export const INDEX_NAMES = Object.keys(INDICES)
