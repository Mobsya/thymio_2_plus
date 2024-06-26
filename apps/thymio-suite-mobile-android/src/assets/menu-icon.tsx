import * as React from 'react';
import {SvgXml} from 'react-native-svg';

const xml = `
<svg fill="#000000" opacity="1" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
</svg>
`;

export default () => <SvgXml xml={xml} width={20} height={20} />;
