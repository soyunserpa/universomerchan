import { Document, Page, Text, View, StyleSheet, Font, Link, Image } from "@react-pdf/renderer";
import { createElement } from "react";
Font.register({ family: "Poppins", fonts: [
  { src: "https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJA.ttf", fontWeight: 400 },
  { src: "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6V1s.ttf", fontWeight: 600 },
  { src: "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7V1s.ttf", fontWeight: 700 },
]});
const RED="#DE0121",BLACK="#111111";
const s=StyleSheet.create({
  page:{fontFamily:"Poppins",fontSize:9,paddingTop:36,paddingBottom:56,paddingHorizontal:36,color:BLACK},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,paddingBottom:12,borderBottomWidth:2,borderBottomColor:RED},
  logo:{fontSize:18,fontWeight:700,color:RED},logoSub:{fontSize:7,color:"#888",marginTop:2},
  quoteNum:{fontSize:13,fontWeight:700,color:RED,textAlign:"right" as const},quoteDate:{fontSize:8,color:"#888",marginTop:2,textAlign:"right" as const},
  section:{marginBottom:16},sectionTitle:{fontSize:11,fontWeight:700,marginBottom:6,color:BLACK},
  clientText:{fontSize:9,lineHeight:1.5,color:"#444"},
  productRow:{flexDirection:"row",marginBottom:16,gap:16},productImage:{width:80,height:80,borderRadius:6,objectFit:"contain" as const,backgroundColor:"#F5F5F5"},
  productInfo:{flex:1,justifyContent:"center"},productName:{fontSize:12,fontWeight:700,marginBottom:2},productDetail:{fontSize:8,color:"#666",marginBottom:1},
  zoneRow:{flexDirection:"row",marginBottom:12,gap:12,paddingBottom:12,borderBottomWidth:1,borderBottomColor:"#E8E8E8"},
  mockupImg:{width:120,height:120,borderRadius:6,objectFit:"contain" as const,backgroundColor:"#F9F9F9"},
  zoneInfo:{flex:1},zoneName:{fontSize:10,fontWeight:700,marginBottom:4},zoneDetail:{fontSize:8,color:"#555",marginBottom:2},
  table:{marginTop:8},tHead:{flexDirection:"row",backgroundColor:BLACK,padding:6,fontSize:7,fontWeight:600,color:"white"},
  tRow:{flexDirection:"row",padding:6,fontSize:8,borderBottomWidth:1,borderBottomColor:"#EEE"},tRowAlt:{backgroundColor:"#FAFAFA"},
  col1:{width:"40%"},col2:{width:"20%",textAlign:"right" as const},col3:{width:"15%",textAlign:"center" as const},col4:{width:"25%",textAlign:"right" as const},
  totalsBox:{marginTop:12,alignSelf:"flex-end" as const,width:220,padding:12,backgroundColor:"#F5F5F5",borderRadius:6},
  totalRow:{flexDirection:"row",justifyContent:"space-between",marginBottom:3,fontSize:9},totalLabel:{color:"#666"},totalValue:{fontWeight:600},
  totalFinal:{flexDirection:"row",justifyContent:"space-between",marginTop:6,paddingTop:6,borderTopWidth:2,borderTopColor:BLACK},
  totalFinalLabel:{fontSize:13,fontWeight:700},totalFinalValue:{fontSize:13,fontWeight:700,color:RED},
  buyBtn:{marginTop:16,backgroundColor:RED,padding:12,borderRadius:20,textAlign:"center" as const},
  buyBtnText:{color:"white",fontSize:11,fontWeight:700,textDecoration:"none"},
  validity:{textAlign:"center" as const,fontSize:8,color:"#888",marginTop:6},
  notes:{marginTop:12,padding:10,backgroundColor:"#FEF3C7",borderRadius:4,fontSize:8,color:"#92400E",lineHeight:1.5},
  footer:{position:"absolute" as const,bottom:18,left:36,right:36,paddingTop:8,borderTopWidth:1,borderTopColor:"#E8E8E8",flexDirection:"row",justifyContent:"space-between",fontSize:7,color:"#999"},
});
export interface QuoteDataV2 {
  quoteNumber:string; date:string; validUntil:string; clientName:string; clientEmail:string; clientCompany?:string; buyUrl:string;
  product:{name:string;masterCode:string;color:string;colorCode:string;size?:string;imageUrl?:string;quantity:number};
  pricing:{unitProductPrice:number;productTotal:number;setupCost:number;printPerUnit:number;printTotal:number;handlingPerUnit:number;handlingTotal:number;grandTotal:number;perUnit:number};
  zones:Array<{positionId:string;positionName:string;techniqueId:string;techniqueName:string;numColors:number;printWidthMm:number;printHeightMm:number;mockupDataUrl?:string}>;
}
function fmt(n:number):string{return n.toFixed(2)+" \u20AC"}
export function QuotePDFV2({data}:{data:QuoteDataV2}){
  const p=data.pricing,hz=data.zones.length>0;
  return createElement(Document,{},createElement(Page,{size:"A4",style:s.page},
    createElement(View,{style:s.header},createElement(View,{},createElement(Text,{style:s.logo},"\uD83C\uDF81 Universo Merchan"),createElement(Text,{style:s.logoSub},"Consigue que tu marca se recuerde")),createElement(View,{},createElement(Text,{style:s.quoteNum},data.quoteNumber),createElement(Text,{style:s.quoteDate},"Fecha: "+data.date),createElement(Text,{style:s.quoteDate},"V\u00e1lido hasta: "+data.validUntil))),
    createElement(View,{style:s.section},createElement(Text,{style:s.sectionTitle},"Datos del cliente"),createElement(Text,{style:s.clientText},data.clientName),data.clientCompany?createElement(Text,{style:s.clientText},data.clientCompany):null,createElement(Text,{style:s.clientText},data.clientEmail)),
    createElement(View,{style:s.section},createElement(Text,{style:s.sectionTitle},"Producto"),createElement(View,{style:s.productRow},data.product.imageUrl?createElement(Image,{style:s.productImage,src:data.product.imageUrl}):null,createElement(View,{style:s.productInfo},createElement(Text,{style:s.productName},data.product.name),createElement(Text,{style:s.productDetail},"Ref: "+data.product.masterCode),createElement(Text,{style:s.productDetail},"Color: "+data.product.color),data.product.size?createElement(Text,{style:s.productDetail},"Talla: "+data.product.size):null,createElement(Text,{style:s.productDetail},"Cantidad: "+data.product.quantity+" uds")))),
    hz?createElement(View,{style:s.section},createElement(Text,{style:s.sectionTitle},"Personalizaci\u00f3n ("+data.zones.length+" zona"+(data.zones.length>1?"s":"")+")"),...data.zones.map((zone,i)=>createElement(View,{key:String(i),style:s.zoneRow},zone.mockupDataUrl?createElement(Image,{style:s.mockupImg,src:zone.mockupDataUrl}):null,createElement(View,{style:s.zoneInfo},createElement(Text,{style:s.zoneName},zone.positionName),createElement(Text,{style:s.zoneDetail},"T\u00e9cnica: "+zone.techniqueName+" ("+zone.techniqueId+")"),createElement(Text,{style:s.zoneDetail},"Colores: "+zone.numColors),createElement(Text,{style:s.zoneDetail},"\u00c1rea m\u00e1x: "+zone.printWidthMm+" \u00d7 "+zone.printHeightMm+" mm"))))):null,
    createElement(View,{style:s.section},createElement(Text,{style:s.sectionTitle},"Desglose de precios"),createElement(View,{style:s.table},createElement(View,{style:s.tHead},createElement(Text,{style:s.col1},"CONCEPTO"),createElement(Text,{style:s.col2},"PRECIO/UD"),createElement(Text,{style:s.col3},"CANT."),createElement(Text,{style:s.col4},"SUBTOTAL")),createElement(View,{style:s.tRow},createElement(Text,{style:s.col1},"Producto ("+data.product.masterCode+")"),createElement(Text,{style:s.col2},fmt(p.unitProductPrice)),createElement(Text,{style:s.col3},String(data.product.quantity)),createElement(Text,{style:s.col4},fmt(p.productTotal))),hz?createElement(View,{style:[s.tRow,s.tRowAlt]},createElement(Text,{style:s.col1},"Preparaci\u00f3n (setup)"),createElement(Text,{style:s.col2},"-"),createElement(Text,{style:s.col3},"1"),createElement(Text,{style:s.col4},fmt(p.setupCost))):null,hz?createElement(View,{style:s.tRow},createElement(Text,{style:s.col1},"Impresi\u00f3n ("+data.zones.map(function(z){return z.techniqueId}).join(", ")+")"),createElement(Text,{style:s.col2},fmt(p.printPerUnit)),createElement(Text,{style:s.col3},String(data.product.quantity)),createElement(Text,{style:s.col4},fmt(p.printTotal))):null,hz&&p.handlingPerUnit>0?createElement(View,{style:[s.tRow,s.tRowAlt]},createElement(Text,{style:s.col1},"Manipulaci\u00f3n"),createElement(Text,{style:s.col2},fmt(p.handlingPerUnit)),createElement(Text,{style:s.col3},String(data.product.quantity)),createElement(Text,{style:s.col4},fmt(p.handlingTotal))):null)),
    createElement(View,{style:s.totalsBox},createElement(View,{style:s.totalRow},createElement(Text,{style:s.totalLabel},"Subtotal producto"),createElement(Text,{style:s.totalValue},fmt(p.productTotal))),hz?createElement(View,{style:s.totalRow},createElement(Text,{style:s.totalLabel},"Subtotal marcaje"),createElement(Text,{style:s.totalValue},fmt(p.setupCost+p.printTotal+p.handlingTotal))):null,createElement(View,{style:s.totalFinal},createElement(Text,{style:s.totalFinalLabel},"Total"),createElement(Text,{style:s.totalFinalValue},fmt(p.grandTotal))),createElement(View,{style:[s.totalRow,{marginTop:4}]},createElement(Text,{style:s.totalLabel},"Precio por unidad"),createElement(Text,{style:s.totalValue},fmt(p.perUnit)))),
    createElement(View,{style:s.buyBtn},createElement(Link,{src:data.buyUrl,style:s.buyBtnText},"Comprar ahora \u2014 Haz clic aqu\u00ed para completar tu pedido")),
    createElement(Text,{style:s.validity},"Este presupuesto es v\u00e1lido hasta el "+data.validUntil+". IVA no incluido."),
    createElement(View,{style:s.notes},createElement(Text,{},"\u2022 Los precios incluyen el producto y la personalizaci\u00f3n indicada.\n\u2022 Los precios no incluyen IVA.\n\u2022 Plazo de entrega: 7-10 d\u00edas laborables desde aprobaci\u00f3n del boceto.\n\u2022 Las im\u00e1genes son orientativas. El color final puede variar ligeramente.\n\u2022 Para +500 uds, contacta para precio especial.")),
    createElement(View,{style:s.footer},createElement(Text,{},"Universo Merchan \u00b7 universomerchan.com"),createElement(Text,{},"pedidos@universomerchan.com \u00b7 Madrid"),createElement(Text,{},"#GeneraEmociones")),
  ));
}
