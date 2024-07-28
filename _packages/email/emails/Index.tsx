import { Html, Head, Preview, Body, Section, Img, Row, Column, Heading } from "@react-email/components";
import React from "react";
import { imageSrc } from "./image";


const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : '';

export const Base = (props: {
    children: React.ReactNode;
    preview: string
    header: string
    subHeader: string
}) => {
    return (
        <Html>
            <Head />
            <Preview>{props.preview}</Preview>
            <Body style={main}>
                <Section style={content}>
                    {/*                     <Section style={logoContainer}>
                        <Img width="200px" src={imageSrc} />
                    </Section> */}

                    <Row style={{ ...boxInfos }}>
                        <Column>
                            <Heading
                                style={{
                                    fontSize: 32,
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                }}
                            >
                                {props.header}
                            </Heading>
                            <Heading
                                as="h2"
                                style={{
                                    fontSize: 26,
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                }}
                            >
                                {props.subHeader}
                            </Heading>

                            {props.children}
                        </Column>
                    </Row>

                </Section>
            </Body>
        </Html>
    )
}

const Test = () => {
    return (
        <Base
            preview="Yelp recent login"
            header="Hi {userFirstName},"
            subHeader="We noticed a recent login to your Yelp account."
        >
            asd
        </Base>
    )
}

export default Test

const main = {
    backgroundColor: '#fff',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const logoContainer = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '60px',
};


const content = {
    border: '1px solid rgb(0,0,0, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
    maxWidth: '600px',
};

const boxInfos = {
    padding: '20px 40px',
};