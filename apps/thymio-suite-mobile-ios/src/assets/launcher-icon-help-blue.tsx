import * as React from 'react';
import { SvgXml } from 'react-native-svg';

const xml = `
<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 22.1.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" id="Calque_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
<style type="text/css">
	.st0{fill:#0A9EEB;}
</style>
<g>
	<path class="st0" fill="#0A9EEB" d="M50.1,0.7C22.8,0.7,0.7,22.9,0.7,50.1s22.2,49.4,49.4,49.4s49.4-22.2,49.4-49.4S77.3,0.7,50.1,0.7z M50.1,93
		C26.4,93,7.2,73.8,7.2,50.1S26.5,7.2,50.1,7.2C73.8,7.2,93,26.4,93,50.1S73.8,93,50.1,93z"/>
	<path class="st0" fill="#0A9EEB" d="M50.1,23.3c-8.7,0-15.8,7.1-15.8,15.8c0,1.8,1.5,3.2,3.2,3.2c1.8,0,3.2-1.5,3.2-3.2c0-5.1,4.2-9.3,9.3-9.3
		s9.3,4.2,9.3,9.3s-4.2,9.3-9.3,9.3c-1.8,0-3.2,1.5-3.2,3.2v11.3c0,1.8,1.5,3.2,3.2,3.2s3.2-1.5,3.2-3.2v-8.4
		C60.5,53,65.8,46.6,65.8,39C65.8,30.3,58.8,23.3,50.1,23.3z"/>
	<path class="st0" fill="#0A9EEB" d="M50.1,68.3c-2.2,0-4.1,1.8-4.1,4.1s1.8,4.1,4.1,4.1c2.2,0,4.1-1.8,4.1-4.1S52.3,68.3,50.1,68.3z"/>
</g>
</svg>
`;

export default ({ ...props }) => <SvgXml xml={xml} width={25} height={25} {...props} />;
