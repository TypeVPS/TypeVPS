import { Typography } from "@suid/material"
import { PageContainer } from "@/components/PageContainer"
import { For } from "solid-js"
import { ContentComponent } from "./base"

const privacy = [
    {
        title: "Information Collection",
        content: `
We collect personal information from customers when they sign up for our services. This information may include:
- Name
- Email address
- Payment information through our payment processors

We also collect non-personal information from our customers, including:
- IP address
- Browser type
- Operating system
- Referring website
- Pages visited
- Location
`
    },
    {
        title: 'Sharing of Information',
        content: `
We do not sell or rent your personal information to third parties.
However, we may disclose your personal information in the following situations:
- To our payment providers, to process your payment for our services
- To comply with legal requirements, such as a subpoena, court order, or government request
- To investigate or prevent fraud or other illegal activities`
    }
]

const TermsOfServicePage = () => {
    return (
        <PageContainer>
            <Typography variant="h1">Privacy Policy</Typography>
            <For each={privacy}>
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