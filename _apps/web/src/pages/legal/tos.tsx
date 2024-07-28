import { Typography } from "@suid/material"
import { PageContainer } from "@/components/PageContainer"
import { For, JSX } from "solid-js"
import { ContentComponent } from "./base"

const terms = [
    {
        title: "Prohibited Uses",
        content: `
You may not use our services to engage in activity that is illegal under applicable law, that is harmful to others, or that would subject us to liability, including, without limitation:

- Mining cryptocurrencies
- Sending spam, conducting phishing attacks, or launching denial-of-service attacks. Or doing anything that will land our IP on a blacklist
- Knowingly distributing malware or other malicious code
- Intellectual property infringement
        `,
    },
    {
        title: "Termination",
        content: `We may terminate or suspend access to our services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        `
    },
    {
        title: "Limitation of Liability",
        content: `We shall not be held liable for any damages whatsoever, including without limitation damages for loss of data or profit, arising out of the use or inability to use our services.
        `
    },
    {
        title: "Changes",
        content: `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        `
    }
]



const TermsOfServicePage = () => {
    return (
        <PageContainer>
            <Typography variant="h1">Terms of Service</Typography>
            <For each={terms}>
                {({ title, content }) => (
                    <>
                        <Typography variant="h2">{title}</Typography>
                        <ContentComponent content={content} />
                    </>
                )}
            </For>
        </PageContainer>
    )
}
export default TermsOfServicePage