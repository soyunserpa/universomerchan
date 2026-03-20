// Test if fabric can load the image server-side
import('fabric').then(async (fabricModule) => {
  const fabric = fabricModule.default || fabricModule;
  console.log('Fabric version:', fabric.version);
  console.log('FabricImage:', typeof fabric.FabricImage);
  console.log('FabricImage.fromURL:', typeof fabric.FabricImage?.fromURL);
  console.log('Image:', typeof fabric.Image);
  console.log('Image.fromURL:', typeof fabric.Image?.fromURL);
  
  // List all exports that contain "Image"
  const keys = Object.keys(fabric).filter(k => k.toLowerCase().includes('image'));
  console.log('Image-related exports:', keys);
});
