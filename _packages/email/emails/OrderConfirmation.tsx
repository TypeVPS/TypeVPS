import * as React from 'react';
import { Base } from './Index';
import { Button, Text } from '@react-email/components';


interface OrderConfirmationEmailProps {
    userFirstName?: string;
    date?: Date;
    productDescription?: string;
    productLink?: string;
    productName?: string;
    productPrice?: number;
    currency?: string;
    locale?: string;
}

export const OrderConfirmationEmail = ({
    userFirstName = 'Zeno',
    date = new Date('September 7, 2022, 10:58 am'),
    productDescription = '10 GB RAM, 4 vCPU, 160 GB SSD',
    productLink = 'https://www.yelp.com',
    productName = 'VPS-10',
    productPrice = 10,
    currency = 'DKK',
    locale = 'da-DK',
}: OrderConfirmationEmailProps) => {
    // format date
    const formattedDate = date.toLocaleString(locale);
    const formattedPrice = productPrice.toLocaleString(locale, {
        style: 'currency',
        currency,
    });

    return (
        <Base
            header={`Hi ${userFirstName},`}
            subHeader='We noticed a recent login to your account.'
            preview='Login Notification'
        >
            <Text style={paragraph}>
                <b>Time: </b>
                {formattedDate}
            </Text>

            <Text style={paragraph}>
                <b>Product Name: </b>
                {productName}
            </Text>

            <Text style={paragraph}>
                <b>Product Description: </b>
                {productDescription}
            </Text>

            <Text style={paragraph}>
                <b>Product Price: </b>
                {formattedPrice}
            </Text>

            <Button style={button} pX={20} pY={12}>
                GO TO PRODUCT
            </Button>
        </Base>
    );
};

const button = {
    backgroundColor: '#007bff',
    width: '100%',
    color: '#ffffff',

    // set text to center
    textAlign: 'center',
    // set border radius
    borderRadius: 4,
    // set padding
    padding: 12,
}
const paragraph = {
    fontSize: 16,
}

export default OrderConfirmationEmail;