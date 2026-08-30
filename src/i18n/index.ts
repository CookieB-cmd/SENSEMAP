import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/common.json'
import nn from './locales/nn/common.json'
const browserLanguage=typeof navigator==='undefined'?'en':navigator.language.toLowerCase()
const suggestedLanguage=browserLanguage.startsWith('nn')||browserLanguage.startsWith('no')||browserLanguage.startsWith('nb')?'nn':'en'
const storedLanguage=typeof localStorage==='undefined'?null:localStorage.getItem('sensemap.language')
void i18n.use(initReactI18next).init({resources:{en:{common:en},nn:{common:nn}},lng:storedLanguage??suggestedLanguage,fallbackLng:'en',supportedLngs:['nn','en'],defaultNS:'common',interpolation:{escapeValue:false}})
if(typeof document!=='undefined'){const sync=(language:string)=>{document.documentElement.lang=language.startsWith('nn')?'nn':'en'};i18n.on('languageChanged',sync);sync(i18n.resolvedLanguage??storedLanguage??suggestedLanguage)}
export default i18n
