APPENDIX D: Printed API Order flow

VALE, TE VOY A IR pasando todo poco a poco y tu ve guardándolo para crear el markdown final hasta que no diga final no ha terminado vale?

1\. Changelog: Changelog

By Christian Amador

1 min

Add a reaction

Version Updates Overview

V.1.12.1

Added Appendix F

Included Pricing Type Calculation Examples

V.1.12

Order Entry Endpoint Updates

Updated to the latest version

Order Details Endpoint Updates

Added additional values

New Proof Management APIs

Proof Approval API

Proof Rejection API

List of Rejection Reasons

Add Artwork API

Postman Collection Updates

Included new APIs

Added Appendix D: Print Order API Flow Diagram

V.1.11

Order Entry Enhancements

Specified mandatory fields

Expanded field explanations

SFTP References Removal

SFTP service is now deprecated and will be discontinued in 2025

Customer API Page Rework

Adjusted API key retrieval instructions

V.1.10.1

Compacted SFTP File Information

Updated code snippets

V.1.10

Minor updates and changes

V.1.9

Minor updates and changes

V.1.8

REST API Method Rework

Refined request method

Customer API Page in Webshop

New entry added

V.1.7 (Obsolete Webservices API)

Complete Removal of Webservices API

Webservices API is now obsolete

Order Entry REST API Added

Order Details & Tracking REST API Added

Layout Rework

Added SFTP and REST API setup guides

Added API error appendix

V.1.6

Added Stock API Call

Added Print Data API Call

This version updates overview now has a clearer structure, making it easy to track changes across the versions. Let me know if you need any further improvements!\
\
` `Who can use the API?

The SOLO midocean API is designed for distributors with their own websites or IT systems. By integrating our API, you can seamlessly provide accurate product, stock, pricing, and print configuration data directly to your end users—automatically and without the need for any manual intervention.

In addition, the midocean API enables you to place orders, check order details, and track the status of your orders, streamlining your entire process.

How can I request a Rest API key?

Be aware that to make connections with the SOLO midocean systems you will require an API key to authorize your connections with our Rest API environment.

Firstly, you need to have an account on the website [Solo midocean | Personalised Promotional Gifts](https://www.midocean.com/)

Log in to your SOLO midocean account, go to your Account, then access the Customer API tab.

Click Register to create an API key that’s linked to your SOLO midocean account.

Open image-20250107-113030.png

Page will refresh and your API key will be displayed.

Open image-20250107-113056.png

Now you can choose which endpoint(s) to subscribe to by selecting them and clicking on Update

Open image-20250107-113123.png

Note about Test environment

There are two distinct REST API environments, each requiring its own API key and each one on a sepparate server with a different URL header.

1\. Production Environment

This is the live environment where all calls are reflected in our production systems and on the website.

Any calls made here will impact real data and orders created will go to Production!

Available 24/7

2\. Test Environment

Calls made in the Test Environment are for testing purposes only and allow you to familiarize yourself with the API system.

You can safely use the Test environment to practice using the Order Create API without any risk as the orders made here only exist in this envrionment.

Only available during Europe business hours.

How to Access the Test Environment

API Key for Test Environment:

To request an API key for the Test environment you can directly contact our technical support team by mailing [digitalsupport@midocean.com](mailto:digitalsupport@midocean.com).

When requesting an API key for Test environment please include your customer number, ex: (808xxx)

We don’t provide keys for Production envrionment, you can follow the instructions as explained earlier.

URL Header for Test Environment:

When using the Test environment, replace the production URL (<https://api.midocean.com>) with the Test environment URL:

[https://apitest.midocean.com](https://apitest.midocean.com)

API Key:

Replace your production API key with the Test API key when making requests in the Test environment.

What information files does API offer?

Available Rest API Files for Integration

Using the Rest API, you can seamlessly integrate product, stock, printing, and pricing data from SOLO midocean into your system. The following files are available for integration:

1\. Stock Information 2.0

Endpoint: [https://api.midocean.com/gateway/stock/2.0](https://api.midocean.com/gateway/stock/2.0)

This file provides the current stock levels for all products in our assortment.

Available in: JSON, XML, and CSV formats.

Updated: Hourly.

2\. Product Information 2.0

Endpoint: [https://api.midocean.com/gateway/products/2.0?language=en](https://api.midocean.com/gateway/products/2.0?language=en)

Contains comprehensive product data, including descriptions, images, attributes, documents, and more.

You can upload all the product information, including textiles, that we offer on our webshop.

Language Options: You can request this file in various European languages by changing the language key in the URL (e.g., use en for English, es for Spanish).

Available Languages: en, es, pt, fr, it, nl, de, hu, ro, cs, sv, fi, da.

Available in: JSON, XML, and CSV formats.

Updated: Daily.

3\. Product Pricelist 2.0

Endpoint: [https://api.midocean.com/gateway/pricelist/2.0/](https://api.midocean.com/gateway/pricelist/2.0/)

This file provides the specific pricing per item for each customer, including any applicable discounts or conditions.

The prices reflected here are the same as those shown on the SOLO midocean webshop or provided by Customer Care.

Available in: JSON, XML, and CSV formats.

Updated: Daily.

4\. Print Pricelist 2.0

Endpoint: [https://api.midocean.com/gateway/printpricelist/2.0/](https://api.midocean.com/gateway/printpricelist/2.0/)

This file contains print prices per print technique, along with handling costs per item.

The prices are the same as those shown on the SOLO midocean webshop or provided by Customer Care.

Available in: JSON, XML, and CSV formats.

Updated: Daily.

5\. Print Data 1.0

Endpoint: [https://api.midocean.com/gateway/printdata/1.0](https://api.midocean.com/gateway/printdata/1.0)

This file contains all available printing options for SOLO midocean products, including print positions, available printing techniques per position, maximum print sizes, maximum print colors, and template images for each position.

Available in: JSON and XML formats.

Updated: Daily.

What services does API offer?

API Services for Order Management and Proof Handling

We offer a range of API services that enable customers to create and manage their orders directly from their systems, eliminating the need to access the Webshop or contact Customer Care.

Starting from version 1.11 of the documentation, we also provide APIs to manage the proof status of print orders. This allows you to Approve, Reject, or Add Artwork to printed orders.

Note that these calls require additional configuration, as they can be personalized for each case. If you're new to the API, we recommend using the Postman collection to automate the configuration process.

Here are the services available via the Rest API:

Order Entry

Endpoint: [https://api.midocean.com/gateway/order/2.1/create](https://api.midocean.com/gateway/order/2.1/create)

This API allows you to place orders with SOLO midocean directly from your system, bypassing the Webshop and Customer Care.

To use this API, send a POST request containing a JSON file with the order details. The system will respond with an order confirmation, order number, and pricing details.

You can integrate this API into your ERP system or directly on your website, ensuring seamless order placement when your customer submits an order.

Order Details

Endpoint: [https://api.midocean.com/gateway/order/2.1/detail?order\_number=order\_number](https://api.midocean.com/gateway/order/2.1/detail?order\_number=order\_number)

This API returns the fully updated order details for any order placed with SOLO midocean. It includes the latest tracking information, forwarder ID, tracking link, and, for print orders, the latest proof download link.

As of version 2.1, the proof status for printed orders is also available, allowing you to check whether the proof is ready or if there are any objections related to the artwork. The list of proof statuses is explained in the Order Details section.

Proof Approval (Print Orders)

Endpoint: [https://api.midocean.com/gateway/proof/1.0/approve](https://api.midocean.com/gateway/proof/1.0/approve)

This API allows you to approve proofs for print orders directly from your system, without needing to visit the website.

Proof Rejection (Print Orders)

Endpoint: [https://api.midocean.com/gateway/proof/1.0/reject](https://api.midocean.com/gateway/proof/1.0/reject)

Use this API to reject proofs for printed orders. You can send a request that includes the order number, order line, rejection reason (see the list of rejection reasons), and any additional files or new artwork that you wish to upload.

Add Artwork (Print Orders)

Endpoint: [https://api.midocean.com/gateway/proof/1.0/addartwork](https://api.midocean.com/gateway/proof/1.0/addartwork)

If a print order is rejected due to artwork issues, you can use this API to upload new artwork by sending a request with the updated files.\
\
Stock Information API

The Stock Information file provides real-time data on the available stock of all products listed on the midocean website.

To access the stock information, make a GET call to the following URL:

Endpoint: [https://api.midocean.com/gateway/stock/2.0](https://api.midocean.com/gateway/stock/2.0)

Key Details:

Update Frequency: The stock information file is updated every hour.

Stock Availability: The stock figure reflects the aggregate stock across all warehouses.

Stock Information: It includes both the current stock and the next two arrivals that have been shipped from China.

Product Availability: All midocean products listed on the Webshop are included in the BC Stock.

Supported Formats:

The file is available in JSON, XML, and CSV formats. By default, the response is in JSON.

To specify the desired format, include an Accept header in your request with the appropriate value:

Accept: text/json for JSON

Accept: text/xml for XML

Accept: text/csv for CSV

Example of Stock API Response:

Here’s a sample of what the stock data may look like. Please note that the example shown below only displays a small part of the full result.

{

`  `"modified\_at": "2023-08-11T23:45:09+02:00",

`  `"stock": [

`    `{

`      `"sku": "KC2364-37",

`      `"qty": 811,

`      `"first\_arrival\_date": "2023-08-25",

`      `"first\_arrival\_qty": 3000,

`      `"next\_arrival\_date": "2023-09-22",

`      `"next\_arrival\_qty": 5000

`    `}

`  `]

}

In this example, the product with SKU KC2364-37 currently has 811 units available. Additionally, 3000 units will arrive on 25/08/2023, and another 5000 units are expected on 22/09/2023.

The modified\_at field shows the last update timestamp, as the stock data is refreshed on an hourly basis.

Product information 2.0

By Christian Amador

1 min

Add a reaction

Product Information 2.0

The Product Information 2.0 file is now exclusively available via the REST API. To facilitate integration, a CSV version is also provided on the SFTP server, based on the REST API.

Currently, it is not possible to retrieve only a portion of the product data or a single SKU/Product.

How to Access the API:

The Product Information REST API can be accessed using a GET request at the following URL:

Endpoint: [https://api.midocean.com/gateway/products/2.0?language=en](https://api.midocean.com/gateway/products/2.0?language=en)

Note: The parameter ?language=en in the URL is mandatory determines the language of the product data returned. Supported languages include:

English, Czech, German, Spanish, French, Hungarian, Italian, Dutch, Polish, Portuguese, Romanian, Russian, Swedish

Available Formats:

JSON (default), XML, and CSV formats.

To specify the desired format, include a header with the key "Accept" and set the value to text/format (e.g., text/json, text/xml, text/csv).

Example Response:

Here’s an example of the response in JSON for product AR1804:

"master\_code": "AR1804",

"master\_id": "40000190",

"type\_of\_products": "stock",

"commodity\_code": "4820 1030",

"number\_of\_print\_positions": "5",

"country\_of\_origin": "CN",

"brand": "midocean",

"product\_name": "ARCONOT",

"category\_code": "MOBOFF\_NOTOTH",

"product\_class": "Notebooks & notepads", "dimensions": "21X14X1,6 CM",

Next you can find a list of all included documents, certifications and compliancy documents for the product in PDF format

"digital\_assets": [ {

"url": "<https://cdn1.midocean.com/document/declaration-of-sustainability/ar1804-green.pdf>",

"type": "document",

"subtype": "declaration\_of\_sustainability" },

{

"url": "<https://cdn1.midocean.com/document/declaration-of-conformity/ar1804-doc.pdf>",

"type": "document",

"subtype": "declaration\_of\_conformity" },

{

"url": "<https://cdn1.midocean.com/document/test-reach/ar1804-test-reach.pdf>", "type": "document",

"subtype": "test\_reach"

The short description and the long description, some more information about material and if it can be printed or not.

"short\_description": "A5 notebook 96 plain sheets",

"long\_description": "A5 notebook with hard PU cover. Casebound. 192 plain pages (96 s heets). Matching elastic closure strap and ribbon page-marker.",

"material": "PU",

"green": "yes",

"printable": "yes",

"polybag": "no",

After this section all the variants of the product are listed, a product will have one or multiple variants, containing colours and/or sizes. Images are available on variant level

"variant\_id": "10168709",

"sku": "AR1804-03", "release\_date": "2015-01-01",

"product\_proposition\_category": "295",

"category\_level1": "Office & Writing",

"category\_level2": "Notebooks",

"category\_level3": "Hard cover",

"color\_description": "black",

"color\_group": "black",

"plc\_status": "16",

"plc\_status\_description": "COLLECTION",

"gtin": "8719941012868",

"color\_code": "03",

"pms\_color": "BLACK",

"digital\_assets": [ {

"url": "<https://cdn1.midocean.com/image/700X700/ar1804-03.jpg>", "url\_highress": "<https://cdn1.midocean.com/image/original/ar1804-03.jpg>", "type": "image",

"subtype": "item\_picture\_front" },

{

"url": "<https://cdn1.midocean.com/image/700X700/ar1804-03-back.jpg>", "url\_highress": "<https://cdn1.midocean.com/image/original/ar1804-03-back.jpg>", "type": "image",

"subtype": "item\_picture\_back" }

` `Print Data 1.0

By Christian Amador

2 min

Add a reaction

The Print data file contains the specifics of printing of each single item in our collection, every time that there is a change on the printing information of a product in our system the file is updated overnight. Printing Data has the following features:

Can be requested via REST API, in json and xml format.

Includes Printing Information about Textiles

Product variants are not separated since they have the same printing information.

Shows specifics print area points.

The Print Data Rest API has to be called at the following URL by making a GET call:  [https://api.midocean.com/gateway/printdata/1.0](https://api.midocean.com/gateway/printdata/1.0)

NOTE:

Available in JSON and XML formats, by default output is in JSON.

Add a header with the key “Accept” and set the value depending on the wanted format, text/”format” (text/json, text/xml)

The printdata file starts with a set of labels with the translations of each Printing Technique in the different languages, so you will not need to make the translations as they can be picked up directly from the file.

{

`  `"printing\_technique\_descriptions": [

`    `{

`      `"id": "B",

`      `"name": [

`        `{

`          `"cs": "Ražba"

`        `},

`        `{

`          `"da": "Prægning"

`        `},

`        `{

`          `"de": "Prägung"

`        `},

`        `{

`          `"en": "Debossing"

`        `},

`        `{

`          `"es": "Termo grabado"

`        `},

`        `{

`          `"fi": "Kohokuviointi"

`        `},

`        `{

`          `"fr": "Embossage"

`        `},

`        `{

`          `"hu": "Dombornyomás"

`        `},

`        `{

`          `"it": "Debossing"

`        `},

`        `{

`          `"nl": "Blinddruk"

`        `},

`        `{

`          `"pl": "Tłoczenie"

`        `},

`        `{

`          `"pt": "Impressão à quente"

`        `},

`        `{

`          `"ro": "Debossing"

`        `},

`        `{

`          `"ru": "Тиснение"

`        `},

`        `{

`          `"sv": "Prägling"

`        `}

`      `]

`    `},

Then, it lists item color variations by code per item.

"master\_code": "AR1804",

"master\_id": "40000190",

"item\_color\_numbers": [

`  `"03",

`  `"04",

`  `"05",

`  `"06",

`  `"10",

`  `"48",

`  `"12",

`  `"37",

`  `"15",

`  `"85"

],

After that information you will get an specific data about the printing options per item. Please, notice that in this case the relation is N:1 as the printing information is the same for the different colours of an item. In this case you can relate the Product Information file with the Printing Information file by the attribute master\_code.

The attribute print\_manipulation specifies the manipulation group of an item, it can be A, B, C, D, E or Z (in some cases if there is none the code will show as null)

If you search this letter code in the print pricelist file you can get the prices for the handling of a product.

"print\_manipulation": "Z",

"print\_template": "<https://printtemplates-v2.cdn.midocean.com/AR1804-print-template.pdf>",

The attributes print\_template contain a pdf with the different print position images which show the layout of the print area, sizes and technique codes.

Open image-20250107-133052.png

In case that there are several Print Positions in one item, you will see that reflecting on the file as different position\_id will be shown. Each one of them will have their specific Printing Techniques, Max. Print Size and Max. Print Colours

"printing\_positions": [

`  `{

`    `"position\_id": "FRONT",

`    `"print\_size\_unit": "mm",

`    `"max\_print\_size\_height": 190.00,

`    `"max\_print\_size\_width": 120.00,

`    `"rotation": 0.00,

`    `"print\_position\_type": "Rectangle",

`    `"printing\_techniques": [

`      `{

`        `"default": false,

`        `"id": "B",

`        `"max\_colours": "1"

`      `},

`      `{

`        `"default": true,

`        `"id": "S2",

`        `"max\_colours": "4"

`      `},

`      `{

`        `"default": false,

`        `"id": "T1",

`        `"max\_colours": "8"

`      `},

`      `{

`        `"default": false,

`        `"id": "TR",

`        `"max\_colours": "1"

`      `}

`    `]

This file also includes a points attribute, it indicates the exact location of the printing points in pixels.

"points": [

`  `{

`    `"distance\_from\_left": 67,

`    `"distance\_from\_top": 45,

`    `"sequence\_no": 1

`  `},

`  `{

`    `"distance\_from\_left": 632,

`    `"distance\_from\_top": 940,

`    `"sequence\_no": 2

`  `}

]

Then it links to the images used in each print position, one with printable area drawn and the other without.\
\
Print Pricelist API

The Print Pricelist API allows you to retrieve the specific customer pricing (based on the API key provided) for the entire midocean product assortment. This information is returned in a JSON format, which you will need to integrate into your database.

How to Access the API:

The Print Pricelist REST API can be accessed using a GET request at the following URL:

Endpoint: [https://api.midocean.com/gateway/pricelist/2.0](https://api.midocean.com/gateway/pricelist/2.0)

Key Requirements:

API Key: You must include your API key in the header of the GET request.

Available Formats:

By default, the output is returned as a JSON file.

To request the file in XML format, include the header with the key "Accept" and set the value to either:

text/json (for JSON format)

text/xml (for XML format)

Example JSON Output:

Here’s a sample of the first part of a JSON output for the Print Pricelist:

{

"currency": "EUR",

"date": "2023-10-31",

` `"price": [

{

"sku": "AR1249-16",

"variant\_id": "10134325",

"price": "4,22",

"valid\_until": "2024-01-31",

"scale": [

{

"minimum\_quantity": "1000",

"price": "3,77"

},

{

"minimum\_quantity": "500",

"price": "3,92"

},

{

"minimum\_quantity": "250",

"price": "4,07"

},

` `{

"minimum\_quantity": "1",

"price": "4,22"

}

` `]

},

Note that tier prices might or might not be available, depending on your region and account\
\
Print Pricelist 2.0

By Christian Amador

3 min

Add a reaction

The Print Pricelist Rest API will return your specific midocean Print Prices.

You can the use the prices included to make your own printed orders using our Order Entry API.

The Print Pricelist Rest API has to be called at the following URL by making a GET call: ▪ [https://api.midocean.com/gateway/printpricelist/2.0](https://api.midocean.com/gateway/printpricelist/2.0)

NOTE:

Available in JSON, XML and CSV formats, by default output is in JSON

Add a header with the key “Accept” and set the value depending on the wanted format, text/”format” (text/json, text/xml, text/csv)

Sample response:

The print pricelist starts with a header that shows the pricelist currency, validity date.

After that there’s a section with the different print manipulations prices and codes to relate to the printing data information.

{

"currency": "EUR",

"pricelist\_valid\_from": "2023-10-31",

"pricelist\_valid\_until": "2023-12-15",

"print\_manipulations": [

{

The printing specific section, here you can check the ID based on info in [Print Data](https://midoceanbrands.atlassian.net/wiki/spaces/AIG/overview#)file, the pricing type, which defines the way that the prices are calculated for the print technique, calculation types can be found in [APPENDIX B: Download and import Postman collection](https://midoceanbrands.atlassian.net/wiki/spaces/AIG/pages/2809659879)

"print\_techniques": [ {

"id": "B",

"description": "Embossing",

"pricing\_type": "NumberOfPositions",

"setup": "60,00",

"setup\_repeat": "20,00",

"next\_colour\_cost\_indicator": "false",

"var\_costs": [

{

"range\_id": "",

"area\_from": "0",

` `"area\_to": "0",

` `"scales": [

{

"minimum\_quantity": "1",

"price": "1,56",

"next\_price": ""

},

{

"minimum\_quantity": "50",

"price": "0,94",

"next\_price": ""

},

{

"minimum\_quantity": "100",

"price": "0,81",

"next\_price": ""

},

General explanation of Scales: Scales are based on the item quantity. If you find the scales 1, 50, 100, … in the file and your item quantity is 60, you have to use the price of scale 50.

General explanation of Manipulation cost: In your calculation you have to multiply the item quantity with the corresponding cost of the manipulation for that item.

The way print prices need to be calculated is described in the former chapter.

Please also take advantage of the calculation examples available in [APPENDIX B: Download and import Postman collection](https://midoceanbrands.atlassian.net/wiki/spaces/AIG/pages/2809659879)

Pricing Type

Price calculation

Example calculation

Number of positions

Print prices are based on the number of positions that you want to print. For example print technique B (Embossing).

Price calculation in case of 3 positions = scale-prices (depending on the quantity) \* 3 positions \* item-quantity.

Number of colours

Print prices are based on the number of colors of the logo.

If next\_colour\_cost\_indicator=’X’ than the 2nd and next colors have another price (price\_next)

Price calculation in case of a 4 colors logo with next\_colour\_cost\_indicator=’ ’ =

price\_1st \* 4 \* item-quantity

Price calculation in case of a 4 colors logo with next\_colour\_cost\_indicator=’X’ =

price\_1st \* 1 \* item-quantity + price\_next \* 3 \* item quantity

Area Range

Print prices are assigned depending on the print area to be used (surface/cm2 of the logo to be printed).

There are different price ranges depending on the area.

Note:  Some ranges for example may end with 100  and the following range start on 100, in this case the highest range is used, so if:

A = 0 - 100

B = 100 - 200

With 100cm2 range B will be used

Once the range is located you can use the price assigned (there is no need to multiply it by the logo area size). See example of technique E:

Open image-20250107-134255.png

Price calculation in case of a 6 cm2 Logo with print technique Embroidery = 2,162 \* item-quantity

Colour Area Range

Print prices are based on the combination of Area ranges and colors of the logo. (Selection of area range depending on the area and price multiplied by the number of colors of the logo).

print-price (selection of range based on area cm2) \* number-of-colors \* item-quantityea and price multiplied by the number of colors of the logo).

Special calculation for non white textile products with ST technique

The following Textile colour variants are considered White and use the regular calculation

AS, WW, WD, WH, NB, NW and RH.

For example S11500-WW-L

For the rest of colour variants the calculation is different

In these cases if you set 2 print colours the setup costs will be that of 2 colours but the print costs always count 1 extra colour, in this case it would be price for 3 colours.

` `The reason behind this extra cost for non-white items is that an extra white layer needs to be printed before printing the actual logo to get the right quality and expected result.

You can find [APPENDIX B: Download and import Postman collection](https://midoceanbrands.atlassian.net/wiki/spaces/AIG/pages/2809659879) with a table that contains a sample calculation for each pricing type.\
\
Postman Collection: JSON

By Christian Amador

2 min

Add a reaction

The Postman collection includes all the midocean APIs preconfigured and grouped for an easier initial setup.

Download the collection here:

midocean\_REST\_API.postman\_collection.json  

After successfully downloading the Postman Collection proceed with the following:

▪ Extract the contents of the ZIP file on your computer's file system.

To import the extracted JSON file into the Postman application, adhere to the subsequent steps:

▪ Launch the Postman application on your computer.

▪ Access the "File" menu situated at the top-left corner of the Postman interface.

▪ From the dropdown menu, select the option labeled "Import".

Open image-20250107-144930.png

▪ Locate the extracted midocean\_postman\_collection.json file on your computer.

▪ Drag and drop the JSON file into the designated import area within the Postman interface.

Open image-20250107-144958.png

▪ Once successfully imported, the Postman collection is readily accessible within the Postman application:

▪ Navigate to the "Collections" tab situated in the sidebar of the Postman interface.

▪ Locate the imported collection within the list of available collections.

Open image-20250107-145015.png

After configuring the collection within Postman, it's imperative to authenticate your requests by integrating your unique API Key:

▪ Navigate to the relevant endpoint within the imported collection.

▪ Locate the designated field labeled "Your API Key here".

▪ Replace the placeholder text with your personal API Key provided by SOLO midocean.

Open image-20250107-145039.png

With your API Key successfully integrated, you're now equipped to initiate requests to the API endpoint:

▪ Ensure all necessary parameters are appropriately configured within the request.

▪ Execute the request by clicking the "Send" button.

▪ Observe the response status and data returned to verify successful communication with the SOLO midocean API\
\
POSTMAN\
\
{

` `"info": {

`  `"\_postman\_id": "023dda0e-0134-4b9b-b39b-aa091c6ea9e7",

`  `"name": "midocean REST API",

`  `"schema": "<https://schema.getpostman.com/json/collection/v2.1.0/collection.json>",

`  `"\_exporter\_id": "30192184"

` `},

` `"item": [

`  `{

`   `"name": "Product information",

`   `"item": [

`    `{

`     `"name": "Product information JSON",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/products/2.0?language=en>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"products",

`        `"2.0"

`       `],

`       `"query": [

`        `{

`         `"key": "language",

`         `"value": "en"

`        `}

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Product information XML",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/xml",

`        `"type": "text"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/products/2.0?language=en>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"products",

`        `"2.0"

`       `],

`       `"query": [

`        `{

`         `"key": "language",

`         `"value": "en"

`        `}

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Product information CSV",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/csv",

`        `"type": "text"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/products/2.0?language=en>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"products",

`        `"2.0"

`       `],

`       `"query": [

`        `{

`         `"key": "language",

`         `"value": "en"

`        `}

`       `]

`      `}

`     `},

`     `"response": []

`    `}

`   `]

`  `},

`  `{

`   `"name": "Stock",

`   `"item": [

`    `{

`     `"name": "Stock JSON",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/stock/2.0>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"stock",

`        `"2.0"

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Stock XML",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/xml",

`        `"type": "text"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/stock/2.0>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"stock",

`        `"2.0"

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Stock CSV",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/csv",

`        `"type": "text"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/stock/2.0>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"stock",

`        `"2.0"

`       `]

`      `}

`     `},

`     `"response": []

`    `}

`   `]

`  `},

`  `{

`   `"name": "Print information",

`   `"item": [

`    `{

`     `"name": "Print feed JSON",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/printdata/1.0>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"printdata",

`        `"1.0"

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Print feed XML",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/xml",

`        `"type": "text"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/printdata/1.0>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"printdata",

`        `"1.0"

`       `]

`      `}

`     `},

`     `"response": []

`    `}

`   `]

`  `},

`  `{

`   `"name": "Pricelists",

`   `"item": [

`    `{

`     `"name": "Product pricelist JSON",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/pricelist/2.0/>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"pricelist",

`        `"2.0",

`        `""

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Print Pricelist JSON",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/printpricelist/2.0/>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"printpricelist",

`        `"2.0",

`        `""

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Product pricelist XML",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/xml",

`        `"type": "text"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/pricelist/2.0/>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"pricelist",

`        `"2.0",

`        `""

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Print Pricelist XML",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/xml",

`        `"type": "text"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/printpricelist/2.0/>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"printpricelist",

`        `"2.0",

`        `""

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Product pricelist CSV",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/csv",

`        `"type": "text"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/pricelist/2.0/>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"pricelist",

`        `"2.0",

`        `""

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Print Pricelist CSV",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/csv",

`        `"type": "text"

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/printpricelist/2.0/>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"printpricelist",

`        `"2.0",

`        `""

`       `]

`      `}

`     `},

`     `"response": []

`    `}

`   `]

`  `},

`  `{

`   `"name": "Create order",

`   `"item": [

`    `{

`     `"name": "Print order",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "POST",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "application/json",

`        `"description": "JSON version",

`        `"type": "text"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/xml",

`        `"description": "XML version",

`        `"type": "text",

`        `"disabled": true

`       `}

`      `],

`      `"body": {

`       `"mode": "raw",

`       `"raw": "{\\r\\n    \\"order\_header\\":{\\r\\n        \\"preferred\_shipping\_date\\":\\"2024-05-01\\",\\r\\n        \\"currency\\":\\"EUR\\",\\r\\n        \\"contact\_email\\":\\"contact e-mail\\",\\r\\n        \\"check\_price\\":\\"false\\",\\r\\n        \\"shipping\_address\\":{\\r\\n            \\"contact\_name\\":\\"Contact name\\",\\r\\n            \\"company\_name\\":\\"Company name\\",\\r\\n            \\"street1\\":\\"Street\\",\\r\\n            \\"street2\\":\\"Street\\",\\r\\n            \\"postal\_code\\":\\"Postal code\\",\\r\\n            \\"city\\":\\"City\\",\\r\\n            \\"region\\":\\"\\",\\r\\n            \\"country\\":\\"NL\\",\\r\\n            \\"email\\":\\"contact e-mail\\",\\r\\n            \\"phone\\":\\"phone\\"\\r\\n        },\\r\\n        \\"po\_number\\":\\"your order reference\\",\\r\\n        \\"timestamp\\":\\"2024-04-24T00:00:00\\",\\r\\n        \\"contact\_name\\":\\"Contact name\\",\\r\\n        \\"order\_type\\":\\"PRINT\\"\\r\\n    },\\r\\n    \\"order\_lines\\":[\\r\\n        {\\r\\n            \\"order\_line\_id\\":\\"1\\",\\r\\n            \\"master\_code\\":\\"AR1804\\",\\r\\n            \\"quantity\\":\\"100\\",\\r\\n            \\"expected\_price\\":\\"0\\",\\r\\n            \\"printing\_positions\\":[\\r\\n                {\\r\\n                    \\"id\\":\\"FRONT\\",\\r\\n                    \\"print\_size\_height\\":\\"190\\",\\r\\n                    \\"print\_size\_width\\":\\"120\\",\\r\\n                    \\"printing\_technique\_id\\":\\"S2\\",\\r\\n                    \\"number\_of\_print\_colors\\":\\"1\\",\\r\\n                    \\"print\_artwork\_url\\": \\"your logo URL\\",\\r\\n                    \\"print\_mockup\_url\\": \\"your mockup URL\\",\\r\\n                    \\"print\_instruction\\":\\"Print instructions\\",\\r\\n                    \\"print\_colors\\":[\\r\\n                        {\\r\\n                            \\"color\\":\\"Pantone 4280C\\"\\r\\n                        }\\r\\n                    ]\\r\\n                }\\r\\n            ],\\r\\n            \\"print\_items\\":[\\r\\n                {\\r\\n                \\"item\_color\_number\\":\\"03\\",\\r\\n                \\"quantity\\":\\"100\\"\\r\\n                }\\r\\n            ]\\r\\n        }\\r\\n    ]\\r\\n}",

`       `"options": {

`        `"raw": {

`         `"language": "json"

`        `}

`       `}

`      `},

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/order/2.1/create>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"order",

`        `"2.1",

`        `"create"

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Normal order",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "POST",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "application/json",

`        `"type": "text"

`       `}

`      `],

`      `"body": {

`       `"mode": "raw",

`       `"raw": "{\\r\\n    \\"order\_header\\": {\\r\\n        \\"preferred\_shipping\_date\\":\\"2024-05-01\\",\\r\\n        \\"check\_price\\": \\"false\\",\\r\\n        \\"currency\\": \\"EUR\\",\\r\\n        \\"contact\_email\\": \\"Contact e-mail\\",\\r\\n        \\"shipping\_address\\": {\\r\\n            \\"contact\_name\\": \\"Contact name\\",\\r\\n            \\"company\_name\\": \\"Company name\\",\\r\\n            \\"street1\\": \\"Street\\",\\r\\n            \\"street2\\": \\"Street\\",\\r\\n            \\"postal\_code\\": \\"Postal code\\",\\r\\n            \\"city\\": \\"City\\",\\r\\n            \\"region\\": \\"\\",\\r\\n            \\"country\\": \\"NL\\",\\r\\n            \\"email\\": \\"contact e-mail\\",\\r\\n            \\"phone\\": \\"phone\\"\\r\\n        },\\r\\n        \\"po\_number\\":\\"your order reference\\",\\r\\n        \\"timestamp\\":\\"2024-04-24T00:00:00\\",\\r\\n        \\"contact\_name\\":\\"Contact name\\",\\r\\n        \\"order\_type\\":\\"NORMAL\\"\\r\\n    },\\r\\n    \\"order\_lines\\": [\\r\\n        {\\r\\n            \\"order\_line\_id\\": \\"1\\",\\r\\n            \\"sku\\": \\"KC3314-32\\",\\r\\n            \\"quantity\\": \\"10\\",\\r\\n            \\"expected\_price\\": \\"0\\"\\r\\n        }\\r\\n    ]\\r\\n}",

`       `"options": {

`        `"raw": {

`         `"language": "json"

`        `}

`       `}

`      `},

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/order/2.1/create>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"order",

`        `"2.1",

`        `"create"

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Sample order",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "POST",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "application/json",

`        `"type": "text"

`       `}

`      `],

`      `"body": {

`       `"mode": "raw",

`       `"raw": "{\\r\\n        \\"order\_header\\": {\\r\\n            \\"preferred\_shipping\_date\\":\\"2024-05-01\\",\\r\\n            \\"check\_price\\": \\"false\\",\\r\\n            \\"currency\\": \\"EUR\\",\\r\\n            \\"contact\_email\\": \\"contact e-mail\\",\\r\\n            \\"shipping\_address\\": {\\r\\n                \\"contact\_name\\": \\"Shipping contact name\\",\\r\\n                \\"company\_name\\": \\"Shipping company name\\",\\r\\n                \\"street1\\": \\"Street\\",\\r\\n                \\"street2\\": \\"Street\\",\\r\\n                \\"postal\_code\\": \\"Postal code\\",\\r\\n                \\"city\\": \\"City\\",\\r\\n                \\"region\\": \\"\\",\\r\\n                \\"country\\": \\"NL\\",\\r\\n                \\"email\\": \\"contact e-mail\\",\\r\\n                \\"phone\\": \\"\\"\\r\\n            },\\r\\n        \\"po\_number\\":\\"your order reference\\",\\r\\n        \\"timestamp\\":\\"2024-04-24T00:00:00\\",\\r\\n        \\"contact\_name\\":\\"Contact name\\",\\r\\n        \\"order\_type\\":\\"SAMPLE\\"\\r\\n        },\\r\\n        \\"order\_lines\\": [\\r\\n            {\\r\\n                \\"order\_line\_id\\": \\"1\\",\\r\\n                \\"sku\\": \\"AR1804-03\\",\\r\\n                \\"quantity\\": \\"1\\",\\r\\n                \\"expected\_price\\": \\"0\\"\\r\\n            }\\r\\n        ]\\r\\n    }",

`       `"options": {

`        `"raw": {

`         `"language": "json"

`        `}

`       `}

`      `},

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/order/2.1/create>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"order",

`        `"2.1",

`        `"create"

`       `]

`      `}

`     `},

`     `"response": []

`    `}

`   `]

`  `},

`  `{

`   `"name": "Order details",

`   `"item": [

`    `{

`     `"name": "Order details",

`     `"protocolProfileBehavior": {

`      `"disabledSystemHeaders": {}

`     `},

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "GET",

`      `"header": [

`       `{

`        `"key": "x-Gateway-APIKey",

`        `"value": "your API Key here"

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "application/json",

`        `"description": "JSON version",

`        `"type": "text",

`        `"disabled": true

`       `},

`       `{

`        `"key": "Accept",

`        `"value": "text/xml",

`        `"description": "XML version",

`        `"type": "text",

`        `"disabled": true

`       `}

`      `],

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/order/2.1/detail?order\_number=000000000>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"order",

`        `"2.1",

`        `"detail"

`       `],

`       `"query": [

`        `{

`         `"key": "order\_number",

`         `"value": "000000000"

`        `}

`       `]

`      `}

`     `},

`     `"response": []

`    `}

`   `]

`  `},

`  `{

`   `"name": "Proof approval",

`   `"item": [

`    `{

`     `"name": "Approve",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "POST",

`      `"header": [

`       `{

`        `"key": "x-customerId",

`        `"value": "{{customerNumber}}"

`       `},

`       `{

`        `"key": "x-correlation-id",

`        `"value": "7e7433f7-d575-4c53-95ab-effa25c13bab"

`       `},

`       `{

`        `"key": "x-token",

`        `"value": ""

`       `}

`      `],

`      `"body": {

`       `"mode": "raw",

`       `"raw": "{\\r\\n  \\"order\_number\\": \\"000000000\\",\\r\\n  \\"order\_line\_id\\": \\"100\\"\\r\\n}",

`       `"options": {

`        `"raw": {

`         `"language": "json"

`        `}

`       `}

`      `},

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/proof/1.0/approve>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"proof",

`        `"1.0",

`        `"approve"

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Reject",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "POST",

`      `"header": [

`       `{

`        `"key": "x-customerId",

`        `"value": "{{customerNumber}}"

`       `},

`       `{

`        `"key": "x-correlation-id",

`        `"value": "7e7433f7-d575-4c53-95ab-effa25c13bab"

`       `},

`       `{

`        `"key": "x-token",

`        `"value": ""

`       `}

`      `],

`      `"body": {

`       `"mode": "raw",

`       `"raw": "{\\r\\n  \\"order\_number\\": \\"000000000\\",\\r\\n  \\"order\_line\_id\\": \\"100\\",\\r\\n  \\"rejection\_code\\": 3,\\r\\n  \\"rejection\_comment\\": \\"Your instructions to prepress\\",\\r\\n  \\"additional\_files\\": [],\\r\\n  \\"new\_artworks\\": []\\r\\n}",

`       `"options": {

`        `"raw": {

`         `"language": "json"

`        `}

`       `}

`      `},

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/proof/1.0/reject>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"proof",

`        `"1.0",

`        `"reject"

`       `]

`      `}

`     `},

`     `"response": []

`    `},

`    `{

`     `"name": "Add artwork",

`     `"request": {

`      `"auth": {

`       `"type": "apikey",

`       `"apikey": [

`        `{

`         `"key": "value",

`         `"value": "your API Key here",

`         `"type": "string"

`        `},

`        `{

`         `"key": "key",

`         `"value": "x-Gateway-APIKey",

`         `"type": "string"

`        `},

`        `{

`         `"key": "in",

`         `"value": "header",

`         `"type": "string"

`        `}

`       `]

`      `},

`      `"method": "POST",

`      `"header": [

`       `{

`        `"key": "x-customerId",

`        `"value": "{{customerNumber}}"

`       `},

`       `{

`        `"key": "x-correlation-id",

`        `"value": "7e7433f7-d575-4c53-95ab-effa25c13bab"

`       `},

`       `{

`        `"key": "x-token",

`        `"value": ""

`       `}

`      `],

`      `"body": {

`       `"mode": "raw",

`       `"raw": "{\\r\\n  \\"order\_number\\": \\"000000000\\",\\r\\n  \\"order\_line\_id\\": \\"100\\",\\r\\n  \\"position\_name\\": \\"FRONT\\",\\r\\n  \\"artwork\_url\\": \\"your logo URL\\"\\r\\n}",

`       `"options": {

`        `"raw": {

`         `"language": "json"

`        `}

`       `}

`      `},

`      `"url": {

`       `"raw": "<https://api.midocean.com/gateway/proof/1.0/addartwork>",

`       `"protocol": "https",

`       `"host": [

`        `"api",

`        `"midocean",

`        `"com"

`       `],

`       `"path": [

`        `"gateway",

`        `"proof",

`        `"1.0",

`        `"addartwork"

`       `]

`      `}

`     `},

`     `"response": []

`    `}

`   `]

`  `}

` `]

}\
\
\
Order Entry API 2.1

The Order Entry API allows midocean distributors to place orders directly into the midocean SAP Logistics System. Using this API will produce the same response as placing an order through Customer Care or the midocean Webshop.

Types of Orders:

Normal Orders:

Unprinted orders with no quantity limit.

Print Orders:

Printed orders with no quantity limit.

Sample Orders:

Unprinted orders with a 5-piece per line limit.

Note: It is not possible to combine different types of orders in the same request.

Important Information to Avoid Errors:

When submitting an order request, the body must use double quotes (") around all fields, even for numeric values. For example:

"order\_line\_id": "1"

Own Design Method:

If you have experience in creating and designing proofs, you can work with your SOLO midocean contact person to directly submit your confirmed artwork without waiting for proof creation and validation. This streamlines the process and speeds things up.

Order Modifications:

Once the order is placed in the midocean system, any cancellations or modifications must be made by contacting Customer Care Agents directly.

Required Files for Integration:

To use the Order Entry API effectively, the following files need to be integrated into your system:

For Normal/Sample Orders:

Stock Information

Product Information

Pricing Information

For Print Orders:

Stock Information

Product Information

Printing Information

Pricing Information

Print Pricing Information

Pre-Stock Check Tool:

To minimize errors and ensure that stock can be fulfilled, it is highly recommended to integrate the Stock Information file and perform a simple check before placing an order. This can be done by checking stock availability at the order entry stage through your website or ERP system.

Express shipment:

You can define that an order will be sent using express shipment by indicating it in the attribute expresswith value “true”. If express is possible for your order you’ll see in the response from order creation the freight costs for such option.

How to Use the Order Entry API:

Endpoint: [https://api.midocean.com/gateway/order/2.1/create](https://api.midocean.com/gateway/order/2.1/create)

The Order Entry API must be called using a POST request.

Fields Appendix

By Christian Amador

2 min

Add a reaction

Regular Fields

Order Header

check\_price

Can be set to true or false.

If set to true, the system checks the price specified in expected\_price. If there's a mismatch with the prices calculated by our systems, the order entry is canceled.

If set to false, the system automatically applies the price based on the product information provided and doesn’t consider the expected\_price.

timestamp

Format: YYYY-MM-DD followed by T and HH:MM:SS (e.g., 2023-03-20T08:17:00).

currency

Specifies the currency for your prices.

po\_number

Enter a purchase order number to reference your order.

Note: The API blocks order entry if the same po\_number is used for a different order to avoid duplication.

contact\_name

Enter the name of the primary contact for the order.

contact\_email

Provide the email address for the primary contact.

Shipping Address

preferred\_shipping\_date

Specify the desired delivery date in the format YYYY-MM-DD (e.g., 2023-03-20).

Notes:

If the date is earlier than the order date, this field will not be used, and the order will be delivered as soon as possible.

This is an optional field; if left empty, the first available system date will be used.

country

Enter the shipping destination country code (e.g., ES, FR, NL).

Note: Shipping destinations are limited based on your account’s region. For details on allowed countries, contact your midocean salesperson or check the webshop under My Account > Saved Addresses.

Order Lines

order\_type

Choose one of the following options:

NORMAL: For unprinted orders.

SAMPLE: For sample orders.

PRINT: For orders with printing.

order\_line\_id

Assign a unique ID to each order line.

Multiple order lines (up to 50 per order) can be added.

This ID will be replaced by midocean's system-generated order line numbers.

sku

Required only for UNPRINTED and SAMPLE orders.

Product-Specific Variant Information

SKU

The product-specific variant SKU follows this format:

For general products: {master\_code}-{variant\_code}

For textiles: {master\_code}-{variant\_code}-{size\_code}

Refer to the "sku" field in product information 2.0.

master\_code (only for PRINTED orders)

The product-specific master code {master\_code}.

Refer to the "master\_code" field in product information 2.0 or printing data 1.0.

expected\_price

If "check\_price" is set to false, this field can always be set to 0 as the calculation is done by our systems.

If "check\_price" is set to true, specify the total price of the order line here.

Print Configuration Fields

id

ID of the print position.

Refer to the "position\_id" field in print data 1.0.

print\_size\_height

Height of the print area in mm, must be less than the maximum height size.

Refer to the "max\_print\_size\_height" field in print data 1.0.

print\_size\_width

Width of the print area in mm, must be less than the maximum width size.

Refer to the "max\_print\_size\_width" field in print data 1.0.

printing\_technique\_id

ID of the print technique.

Refer to the "position\_id" field in print data 1.0.

number\_of\_print\_colours

The number of colours in your logo.

Refer to the "max\_colours" field in print data 1.0.

Note: Techniques with "0" in "max\_colours" have no limit on the number of colours.

print\_artwork\_url

URL where the logotype to be printed can be found.

print\_mockup\_url

URL showing the representation/indications of the logotype position in the print area.

print\_instruction

Instructions for the pre-press department (Max: 300 characters).

color

Pantone colours for printing the logotype (Max: 12 characters).

The number of colours specified must match the "number\_of\_print\_colours".

item\_color\_number

The code of the variant.

Refer to the "variant\_color" field in print data 1.0 or the "color\_code" field in product information 2.0.

item\_size (ONLY FOR TEXTILE ITEMS)

Specifies the textile size.

Order Request format (JSON)

By Christian Amador

2 min

Add a reaction

Regular Order

Regular orders are plain and unprinted, allowing multiple order lines.

Note:

Textile products cannot be ordered with NORMAL orders. For textiles, use the SAMPLE or PRINT order types instead.

Below is an example format for a NORMAL order with one line:

{

`  `"order\_header": {

`    `"preferred\_shipping\_date": "2024-05-01",

`    `"currency": "EUR",

`    `"contact\_email": "contact email",

`    `"check\_price": "false",

`    `"shipping\_address": {

`      `"contact\_name": "Contact name",

`      `"company\_name": "Company name",

`      `"street1": "Street",

`      `"postal\_code": "Postal code",

`      `"city": "City",

`      `"region": "",

`      `"country": "NL",

`      `"email": "contact email",

`      `"phone": "phone"

`    `},

`    `"po\_number": "your order reference",

`    `"timestamp": "2024-04-24T00:00:00",

`    `"contact\_name": "Contact name",

`    `"order\_type": "NORMAL",

`    `"express": "false"

`  `},

`  `"order\_lines": [

`    `{

`      `"order\_line\_id": "10",

`      `"sku": "KC3314-32",

`      `"variant\_id": "10144631",

`      `"quantity": "1",

`      `"expected\_price": "0"

`    `}

`  `]

}

Print Order

Print orders allow you to specify the printing configuration for each product and print position for every order line. Additionally, you can order multiple variants (colors or sizes) within the same line.

Important Notes:

You cannot combine printed and unprinted items in the same order request.

To place printed orders, integration with the Print Data and Print Pricelist APIs is required to retrieve the necessary details.

Example: PRINT Order with One Line

{

`  `"order\_header": {

`    `"preferred\_shipping\_date": "2024-05-01",

`    `"currency": "EUR",

`    `"contact\_email": "contact email",

`    `"check\_price": "false",

`    `"shipping\_address": {

`      `"contact\_name": "Contact name",

`      `"company\_name": "Company name",

`      `"street1": "Street",

`      `"postal\_code": "Postal code",

`      `"city": "City",

`      `"region": "",

`      `"country": "NL",

`      `"email": "contact email",

`      `"phone": "phone"

`    `},

`    `"po\_number": "your order reference",

`    `"timestamp": "2024-04-24T00:00:00",

`    `"contact\_name": "Contact name",

`    `"order\_type": "PRINT",

`    `"express": "false"

`  `},

`  `"order\_lines": [

`    `{

`      `"order\_line\_id": "10",

`      `"master\_code": "AR1804",              // \* Mandatory Field

`      `"quantity": "",                       // \* Mandatory Field

`      `"expected\_price": "",

`      `"printing\_positions": [

`        `{

`          `"id": "FRONT",                   // \* Mandatory Field

`          `"print\_size\_height": "24",       // \* Mandatory Field (in mm)

`          `"print\_size\_width": "45",        // \* Mandatory Field (in mm)

`          `"printing\_technique\_id": "S2",   // \* Mandatory Field

`          `"number\_of\_print\_colors": "1",   // \* Mandatory Field

`          `"print\_artwork\_url": "<https://www.url.com/logo>", // \* Mandatory Field

`          `"print\_mockup\_url": "<https://www.url.com/mockup>",

`          `"print\_instruction": "None",

`          `"print\_colors": [

`            `{

`              `"color": "PMS 0 C"           // \* Mandatory Field

`            `}

`          `]

`        `}

`      `],

`      `"print\_items": [

`        `{

`          `"item\_color\_number": "05",       // \* Mandatory Field

`          `"quantity": "10"                 // \* Mandatory Field

`        `}

`      `]

`    `}

`  `]

}

Textile print Order

Textile print orders require an additional parameter to define the size that will be ordered:

item\_size is added inside print\_itemsto hold the size of each color variant.

{

`  `"order\_header": {

`    `"preferred\_shipping\_date": "2024-05-01",

`    `"currency": "EUR",

`    `"contact\_email": "contact email",

`    `"check\_price": "false",

`    `"shipping\_address": {

`      `"contact\_name": "Contact name",

`      `"company\_name": "Company name",

`      `"street1": "Street",

`      `"postal\_code": "Postal code",

`      `"city": "City",

`      `"region": "",

`      `"country": "NL",

`      `"email": "contact email",

`      `"phone": "phone"

`    `},

`    `"po\_number": "your order reference",

`    `"timestamp": "2024-04-24T00:00:00",

`    `"contact\_name": "Contact name",

`    `"order\_type": "PRINT",

`    `"express": "false"

`  `},

`  `"order\_lines": [

`    `{

`      `"order\_line\_id": "1",

`      `"master\_code": "S11500",

`      `"quantity": "50",

`      `"expected\_price": "0",

`      `"printing\_positions": [

`        `{

`          `"id": "FRONT",

`          `"print\_size\_height": "49",

`          `"print\_size\_width": "50",

`          `"printing\_technique\_id": "ST1",

`          `"number\_of\_print\_colors": "1",

`          `"print\_artwork\_url": "<https://www.url.com/logo>",

`          `"print\_mockup\_url": "<https://www.url.com/mockup>",

`          `"print\_instruction": "None",

`          `"print\_colors": []

`        `}

`      `],

`      `"print\_items": [

`        `{

`          `"item\_color\_number": "AG",

`          `"item\_size": "L",

`          `"quantity": "50"

`        `}

`      `]

`    `}

`  `]

}

Sample Order

Sample orders are structurally similar to normal orders, with the following differences:

They are restricted to 5 pieces or less per order line.

Unprinted textile products can be ordered with these.

Printing is not allowed for sample orders.

Note: With sample orders, you can order unprinted textile products, but only up to a maximum of 5 pieces.

Example: Sample Order with One Line

{

`  `"order\_header": {

`    `"check\_price": "",

`    `"proof\_approved": "",

`    `"timestamp": "",

`    `"currency": "",

`    `"po\_number": "",

`    `"contact\_name": "",

`    `"contact\_email": "",

`    `"shipping\_address": {

`     `"contact\_name": "Name",              // \* Mandatory Field

`     `"company\_name": "",

`     `"street1": "Address",                // \* Mandatory Field

`     `"postal\_code": "0000",

`     `"city": "City",                      // \* Mandatory Field

`     `"region": "Region",

`     `"country": "ES",                     // \* Mandatory Field

`     `"email": "<contact@mail.com>",

`     `"phone": "000000000"

`  `},

`        `"order\_type": "SAMPLE",           // \* Mandatory Field

`        `"preferred\_shipping\_date": "YYYY-MM-DD"

`    `},

`    `"order\_lines": [

`    `{

`            `"order\_line\_id": "1",

`            `"sku": "KC3314-32",           // \* Mandatory Field

`            `"quantity": "1",              // \* Mandatory Field (Max 5 pieces)

`            `"expected\_price": "0"

`        `}

`    `]

}\
\
Order Response

After the POST request is made our systems will respond with the “status\_code” and “status\_text” to indicate if the order went through or failed. To check on possible error resolutions g[o here.](https://midoceanbrands.atlassian.net/wiki/spaces/AIG/overview#)

Response for all types of orders is the same, only difference is for PRINT orders the print costs will show a the price, for the rest they will be at 0.

In this example you can see the response to the PRINT order that we set as example, at the header the prices are indicated. The rest of the response is just the order details we specified on the request.

{

`  `"order\_header": {

`    `"status\_code": "0",

`    `"status\_text": "Sales order successfully created",

`    `"direct\_confirmation": "",

`    `"proof\_approved": "false",

`    `"check\_price": "false",

`    `"currency": "EUR",

`    `"po\_number": "test order 2.0",

`    `"order\_type": "PRINT",

`    `"order\_number": "2623021",

`    `"total\_item\_price": "68,00",

`    `"total\_print\_costs": "208,40",

`    `"total\_net\_price": "297,35",

`    `"freight\_charge": "16.000000000",

`    `"tax": "68,39",

`    `"print\_setup": "140,00",

`    `"print\_cost": "67,40",

`    `"print\_handling": "1,00",

`    `"shipping\_address": {

`      `"contact\_name": "Name",

`      `"company\_name": "Company",

`      `"street1": "Address",

`      `"street2": "",

`      `"street3": "",

`      `"postal\_code": "0000",

`      `"city": "City",

`      `"region": "Region",

`      `"country": "ES",

`      `"email": "<contact@mail.com>",

`      `"phone": "000000000"

`    `}

`  `}

}

Error Resolutions

By Christian Amador

2 min

Add a reaction

Handling Errors in API Orders

When making an order through the API, it is possible for the system to return an error message. Typically, the response will include:

"status\_code": 99 (indicates an error).

"status\_text": A description of the error.

The error message is usually self-explanatory. However, for certain cases, here is a list of common errors and their explanations.

IMPORTANT: Avoiding Errors

All fields in the request body must use double quotes ("), even for numerical fields.

Example: "order\_line\_id": "1"

Common Errors

1\. Insufficient Stock

This error occurs when:

The product specified in the order request doesn’t have enough stock.

The preferred shipping date is set too soon, not allowing stock to arrive at the warehouse.

Solution:

Check stock availability by importing the stock file.

Example of a 999 Insufficient Stock Error Response:

{

`  `"order\_header": {

`    `"status\_code": "999",

`    `"status\_text": "Insufficient stock",

`    `"direct\_confirmation": ""

`  `}

}

Invalid date pattern or input

The “preferred\_shipping\_date” or “timestamp” field doesn’t follow the correct format, they should be set as in here:

Delivery Date: YYYY-MM-DD

Example: 2023-03-20

Timestamp: YYYY-MM-DDTHH:MM:SS (Date, followed by a "T", and then Time).

Example: 2023-03-03T08:17:00

Common Errors and Resolutions

1\. An Order with Your Reference Already Exists

When placing an API order, if the "po\_number" matches that of a previous order, the system will return an error to prevent duplicate orders.

Solution:

You can bypass this by leaving the "po\_number" field empty.

2\. Destination Country Is Not Allowed

This error occurs when:

The "country" field contains a code that is not permitted for your API key's region.

Solution:

Contact your midocean salesperson to confirm the allowed shipping countries for your sales organization.

The list of valid countries matches the ones available in the webshop. You can verify these under My Account > Saved Addresses.

3\. Delivery Date Not Feasible

This error is not always related to the "preferred\_shipping\_date" field as the message might suggest. Instead, it is often caused by improperly formatted .json in the order request.

Example:

If fields in the JSON request are not enclosed in double quotes, it will trigger this error.

Correct Format Example:

{

`  `"order\_line\_id": "1",

`  `"sku": "ABC123",

`  `"quantity": "10"

}

Open image-20250107-140631.png

Order Details 2.1

By Christian Amador

2 min

Add a reaction

API for Retrieving Order Details & Tracking

By using this API, SOLO midocean distributors can retrieve all order information, details, and updated tracking for any order they have placed in the system.

Endpoint for Order Details & Tracking

To get the details, make a GET request to the following URL:

[https://api.midocean.com/gateway/order/2.1/detail?order\_number=OrderNumber](https://api.midocean.com/gateway/order/2.1/detail?order\_number=OrderNumber)

Note: Replace "OrderNumber" with the specific order number you want to check.

Response Overview

The output will be a file containing the updated order details from SOLO midocean’s system. Below is a breakdown of the response:

Order Header

The order\_header section provides key details about the order, customer, and shipping address:

Order Creation Date: The date the order was placed.

Order Status: Can be OPEN, COMPLETED, or CLOSED.

Customer Details: Includes the customer number, contact person, and PO number.

Shipping Address: Information about where the order is being shipped.

Sales Organization: Sales organization associated with the order.

Example Response:

"order\_header": {

`    `"order\_found": "true",

`    `"order\_number": "2622891",

`    `"order\_date": "2023-08-10",

`    `"order\_status": "OPEN",

`    `"sales\_org": "0101",

`    `"currency": "EUR",

`    `"customer\_number": "80865772",

`    `"contact\_person": "Customer Care",

`    `"po\_number": "test order 2.0",

`    `"order\_type": "PRINT",

`    `"shipping\_address": {

`        `"company\_name": "Company",

`        `"contact\_name": "Name",

`        `"street1": "Address",

`        `"postal\_code": "0000",

`        `"city": "City",

`        `"region": "",

`        `"country": "ES",

`        `"email": "<contact@mail.com>",

`        `"phone": "000000000"

`    `}

}

Order Pricing & Transport Details

This section includes the following details:

Total Price Breakdown: Product, printing, discount, transport, and tax prices.

Transport Mode: Standard or Express.

Incoterms: Delivery terms for the order.

Example Response:

"order\_header": {

`    `"total\_item\_price": "111.0",

`    `"discounts": "0.0",

`    `"total\_print\_costs": "96.0",

`    `"freight\_charge": "24.95",

`    `"total\_net\_price": "231.95",

`    `"tax": "0.0",

`    `"total\_gross\_price": "231.95",

`    `"incoterms": "DAP",

`    `"delivery\_service": "STANDARD"

}

Example tracking response (found inside order\_lines):

"shipping\_status": "COMPLETED",

"shipping\_date": "2025-03-07",

"forwarder": "UPS",

"tracking\_number": "XXXXXX",

"tracking\_url": "<https://www.ups.com/mobile/track?trackingNumber=XXXXXX>"

Order Lines

The order\_lines section details the products in the order:

Order Line Details: For each order line, details such as the order\_line\_id, master\_code, quantity, item price, and printing costs are provided.

Shipping: Includes shipping dates and shipping status

Printing Information: Includes print setup, proof URL and proof status.

Example Response:

"order\_lines": [

`    `{

`        `"order\_line\_id": "100",

`        `"master\_code": "AR1804",

`        `"master\_id": "40000190",

`        `"quantity": "1",

`        `"item\_price": "0.0",

`        `"print\_setup": "50.0",

`        `"print\_cost": "5.76",

`        `"print\_handling": "0.24",

`        `"proof\_url": "<https://proofURL..../proofs/XXXX/LatestProofPDF>",

`        `"shipping\_status": "OPEN",

`        `"proof\_status": "InProgress",

`        `"shipping\_date": "2023-08-22",

`        `"print\_items": [

`            `{

`                `"sku": "AR1804-03",

`                `"variant\_id": "10168709",

`                `"quantity": "6",

`                `"item\_price": "1.2"

`            `}

`        `],

`        `"printing\_positions": [

`            `{

`                `"id": "FRONT",

`                `"print\_size\_height": "190",

`                `"print\_size\_width": "120",

`                `"printing\_technique\_id": "B",

`                `"number\_of\_print\_colors": "1"

`            `}

`        `]

`    `}

]

Order Status Values

Order Status: OPEN, COMPLETED, CANCELLED

Order Type: PRINT, NORMAL, SAMPLE

Proof Status: InProgress, ArtworkRequired, WaitingApproval, Approved

Incoterms: Exworks, DAP

Service Type: Standard, Express

Delivery Status: Open, Shipped

Approve Proof 1.0

By Christian Amador

Add a reaction

Approve Proof API

By using this API, SOLO midocean distributors can confirm an existing proof on an order. This API can only be used for proofs that have a status of “WaitingApproval”, as returned by the Order Detail API.

Endpoint for Approving a Proof

To approve a proof, make a POST request to the following URL:

[https://api.midocean.com/gateway/proof/1.0/approve](https://api.midocean.com/gateway/proof/1.0/approve)

Required Request Body:

{

`  `"order\_number": "xxxxxxx",

`  `"order\_line\_id": "100"

}

order\_number: Specifies the affected order.

order\_line\_id: Specifies the affected order line combination.

The order\_number and order\_line\_id values can be obtained from the Order Detail API response.

Expected Output:

For a successful request, the system will respond with a 200 status code, and the proof status will change to “Approved” in the Order Detail API.

Reject Proof 1.0

By Christian Amador

1 min

Add a reaction

Reject Proof API

By using this API, SOLO midocean distributors can reject an existing proof on an order. This API can only be used for proofs that have a status of “WaitingApproval”, as returned by the Order Detail API.

Endpoint for Rejecting a Proof

To reject a proof, make a POST request to the following URL:

[https://api.midocean.com/gateway/proof/1.0/reject](https://api.midocean.com/gateway/proof/1.0/reject)

Required Request Body:

{

`  `"order\_number": "xxxxxxx",

`  `"order\_line\_id": "100",

`  `"rejection\_code": 3,

`  `"rejection\_comment": "Your rejection comments or instructions here",

`  `"additional\_files": ["https://www.url.com/file1", "https://www.url.com/file2", "..."],

`  `"new\_artworks": ["https://www.url.com/artwork1", "https://www.url.com/artwork2", "..."]

}

order\_number: Specifies the affected order.

order\_line\_id: Specifies the affected order line combination.

rejection\_code: Refers to the numeric code for the rejection reason (refer to Appendix E for the full table of rejection codes).

rejection\_comment: A placeholder for any additional instructions to be provided to the prepress department.

additional\_files: An array containing URLs for any additional files or instructions.

new\_artworks: An array containing URLs for new artworks (used when the rejection reason is “Change artwork”).

Expected Output:

For a successful request, the system will respond with a 200 status code, and the proof status will change to “InProgress” in the Order Detail API.\
\
Add Artwork 1.0

By Christian Amador

1 min

Add a reaction

Add Artwork API

By using this API, SOLO midocean distributors can submit an artwork to be used by prepress for preparing a new proof for an order. This API can only be used for proofs that have a status of “ArtworkRequired”, as returned by the Order Detail API.

Endpoint for Submitting Artwork

To submit an artwork, make a POST request to the following URL:

[https://api.midocean.com/gateway/proof/1.0/addartwork](https://api.midocean.com/gateway/proof/1.0/addartwork)

Required Request Body:

{

`  `"order\_number": "xxxxxxx",

`  `"order\_line\_id": "100",

`  `"position\_name": "ROUNDSCREEN",

`  `"artwork\_url": "<https://www.url.com/artwork>"

}

order\_number: Specifies the affected order.

order\_line\_id: Specifies the affected order line combination.

position\_name: Refers to the print position where the artwork will be used (this information is provided in the Order Detail API response).

artwork\_url: A unique URL pointing to the artwork to be used for the proof.

Expected Output:

For a successful request, the system will respond with a 200 status code, and the proof status will change to “InProgress” in the Order Detail API.\
\
APPENDIX A: Rest API integration with Postman

By Christian Amador

2 min

Add a reaction

Depending on the software you are using on your website or ERP system you need an XML parser and communication software to integrate with our API.

A common library used for communication is Curl which is available for Java, C/C++, PHP, etc. Website: [libcurl - your network transfer library](https://curl.haxx.se/libcurl/)

For testing the communication with our Rest API, you can have a look at Postman.

Postman is collaboration platform for API development which is available in open source on Windows, Linux and Mac OS.

Website[Postman: The World's Leading API Platform | Sign Up for Free](https://www.postman.com/)

When testing with our Rest API it is handy to have a test environment available.

Instead of using live URLs (located a[t https://api.midocean.com)](https://api.midocean.com/)you may use our test environment, reachable a[t https://apitest.midocean.com.](https://apitest.midocean.com/)

(NOTE: You have to request a separate key to use this environment)

Here’s a quick guide of how to create and manage your Postman Rest API calls.

▪ Download Postman here: [Download Postman | Get Started for Free](https://www.postman.com/downloads/)

Open image-20250107-144139.png

After installing Postman, click on New button, then select Collection. A collection acts a folder to store every Rest API call.

Open image-20250107-144159.png

▪ To add the API calls follow same procedure, but select HTTP Request

▪ Once created you can change the name to know which API it is,

in this example we create a request for Product Information file, but the procedure is the same for all files, just changing the link.

▪ In the request URL type the url of the specific request you are going to make, in this case: [https://api.midocean.com/gateway/products/2.0?language=en](https://api.midocean.com/gateway/products/2.0?language=en)

Open image-20250107-144322.png

▪ Press on the Save button to save the HTTP Request, set a name to identify which call you’re making, then select the collection you created and click save to add it in the collection folder

Open image-20250107-144338.png

▪ Now last step is to add the authorization, meaning the Rest API key. To do that select the Authorization tab

▪ In Type, select API Key, then put the next values

▪ Key: x-Gateway-APIKey

▪ Value: (your Rest API key)

Open image-20250107-144406.png

▪ If you want to choose between .xml and .json output; Go to Headers tab and set create a new header with

▪ Key: Accept ▪ Value:

▪ text/xml - to request in xml ▪ text/json - to request in json

Open image-20250107-144422.png

▪ Now save the call and click on Send to request the data, and that’s it! Later on the guide we’ll present you the many options for API information and service calls you can make.

APPENDIX C: API integration errors

By Christian Amador

2 min

Add a reaction

Common API Errors and Workarounds

When using our API services, you may encounter various errors. These can arise from connection issues, incorrect API call setup, wrong parameters, links, IDs, and many other factors. Below is a compilation of some common errors and their potential solutions.

Error: “503 Service Temporarily Unavailable”

Cause: This error occurs when the communication to the API service is unavailable or when there are connection issues. Possible reasons include:

Connecting to the TEST Environment API: The TEST Environment is switched off during non-business hours in Europe (evening time).

Error: “Unauthorized Application Request”

Cause: This error indicates that the authorization to make the API request is not working. This can happen for the following reasons:

Rest API Key not set up correctly:

Solution: Ensure that the Rest API Key is written correctly and that the header contains the correct “Value” and “Key”. If you’re unsure, you can test the API calls using Postman.

Rest API Key is invalid or lacks proper permissions:

Solution: Go to the Webshop and navigate to Account > Customer API. Click the “Request new API key” button to request a new API key. Select the missing APIs and click “Subscribe” to gain the necessary permissions to access the calls.

Using the wrong API key for the environment:

Solution: Make sure you’re using the correct API key for the environment. The TEST and PRODUCTION environments require separate API keys.

Error: “404 Not Found” or “403 Forbidden”

Cause: Both errors typically occur when the endpoint URL is incorrect.

Solution: Refer to the list of valid API endpoint URLs to ensure the correct URL is being used.

When i make the GET request the file is always in .json format even with the “Accept” header set

Cause: The HTTP version used is not 1.1

Solution: This can be fixed by setting the request to use HTTP 1.1

In Postman by setting the HTTP version to 1.x

Open image-20250710-072417.png

An example using cURL

CURLOPT\_HTTP\_VERSION => CURL\_HTTP\_VERSION\_1\_1,

When requesting the Product information file i get a link instead of the information file

Cause: Automatically follow redirects is not enabled

Solution

In Postman by activating this setting

Open image-20250710-073000.png

An example using cURL \
CURLOPT\_FOLLOWLOCATION => true,

\
![imagen-pegada.tiff](Aspose.Words.c9bd37bf-e7a8-4b33-8349-2337def78afc.001.png)\
APPENDIX E: List of rejection reasons

By Christian Amador

Add a reaction

Code

Description

Code

Description

1

This is a repeat order

2

Change the print technique

3

The logo looks blurred

4

The proof is not according to my expectations

6

Change the imprint size

8

Change the logo

9

Move logo or artwork within selected position

10

Change the print position

11

Change the number of imprint colours

12

Change the item colour

13

Change the imprint colour

14

Remove or change part of the logo

15

Change the item quantity

16

I’d like to approve a previous proof version\
\
APPENDIX F: Print pricing calculation

By Christian Amador

1 min

Add a reaction

Prices Considered into the Print Calculation Formula:

1\. Pricelist 2.0 API

Product

This is the regular product price, which can be based on scaled quantities or not.

Field: "price"

2\. Print Pricelist 2.0 API

Manipulation (Handling)

This is the cost of product handling, dependent on the product, not the print configuration.

Field "price" inside "print\_manipulations"

Setup

This is a one-time cost for preparing each color/position for the specific technique, based on the number of colors and positions.

Field: "setup"

OR

If the order is a repeat order “setup\_repeat" instead of regular setup price

Printing

This is the actual cost for the print technique, based on quantity, technique, number of colors, and print area range.

Field: "price" inside "var\_costs"

AND

If technique price is based on number of colours field "next\_price" when using more than 1 colour

Type calculation examples

By Christian Amador

1 min

Add a reaction

Below is a table that contains examples of calculations for each pricing type.

NOTE: For most textile products calculation is different depending if the product variant requested is based on White or not.

Variants considered white: AS, WW, WD, WH, NB, NW and RH.

For all other colours calculation is always considering the next colour, so if you want 2 print colours calculation will use 3. This increases the Print cost to be for 3 colours but the Setup cost remains for 2 colours.

Pricing Type

Print technique

Sample prices

Quantity

Nr. of colours

cm2

Nr. of positions

Setup cost

Printing cost

Handling cost

Total print cost

Pricing Type

Print technique

Sample prices

Quantity

Nr. of colours

cm2

Nr. of positions

Setup cost

Printing cost

Handling cost

Total print cost

NumberOfColours

S2

Setup cost = 27,5

Print cost = 0,53

Print cost (next colour) = 0,37

Handling C = 0,18

250

4

27,5 \* 4 colours= 110

0,53 \* 250 = 132,5

(0,37 \* 3 colours \* 250) = 277,5

132,5+ 277,5= 410

0,18 \* 250 = 45

110 + 410 + 45 = 565

ColourAreaRange

T1

Setup cost = 30

Print cost Range B = 0,87

Print cost Range B (next colour) = 0,39

Handling C = 0,18

250

8

100

30 \* 8 colours = 240

0,87 \* 250 = 217,5

(0,39 \* 7 colours \* 250) = 682,5

217,5 + 682,5 = 900

0,18 \* 250 = 45

240 + 900 + 45 = 1185

AreaRange

E

Setup Costs = 40

Printing Costs Range F= 1,82

Handling C = 0,18

250

100

40

1,82 \* 250 = 455

0,18 \* 250 = 45

40 + 455 + 45 = 540

NumberOfPositions

L3

Setup Costs = 17,5

Printing Costs = 0,34

Handling C = 0,18

250

3

17,5 \* 3 positions = 52,5

0,34 \* 250 \* 3 = 255

0,18 \* 250 = 45

52,5+ 255+ 45 = 307,5

Fin da la documentación
