import * as React from 'react';
import { Base } from './Index';
import { Text } from '@react-email/components';
import { RecentLoginEmailProps } from '../src';

export const RecentLoginEmail = ({
    userFirstName = 'Zeno',
    loginDate = new Date('September 7, 2022, 10:58 am'),
    loginDevice = 'Chrome on Mac OS X',
    loginLocation = 'Upland, California, United States',
    loginIp = '47.149.53.167',
    contactUrl = 'https://report.com',
    locale = 'da-DK',
}: RecentLoginEmailProps) => {
    const formattedDate = loginDate.toLocaleString(locale);


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
                <b>Device: </b>
                {loginDevice}
            </Text>

            <Text style={paragraph}>
                <b>Location: </b>
                {loginLocation}
            </Text>

            <Text style={paragraph}>
                <b>IP Address: </b>
                {loginIp}
            </Text>

            <Text style={paragraph}>
                If this was you, you can safely ignore this email.
                If you don't recognize this activity, please{' '}
                <a href={contactUrl}>
                    let us know
                </a>
                .
            </Text>
        </Base>
    );
};

const paragraph = {
    fontSize: 16,
}

export default RecentLoginEmail;