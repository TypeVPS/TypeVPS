import {
	Container,
	Grid,
	Typography,
	Link,
	Paper,
	Stack,
} from "@suid/material";
import lang from "@/lang";

export function Footer() {
	return (
		<Paper sx={{ py: 6, mt: 6 }}>
			<Container maxWidth="lg">
				<Grid container spacing={4} justifyContent="space-evenly">
					<Grid item xs={12} sm={6} md={3}>
						<Typography variant="h6" gutterBottom>
							{lang.t.productName()}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{lang.t.productFooterDescription()}
						</Typography>
					</Grid>

					<Grid item xs={12} sm={6} md={3}>
						<Typography variant="h6" gutterBottom>
							Legal
						</Typography>
						<Stack>
							<Link href="/tos" color="text.secondary">
								Terms of Service
							</Link>

							<Link href="/privacy" color="text.secondary">
								Privacy Policy
							</Link>
						</Stack>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<Typography variant="h6" gutterBottom>
							Social
						</Typography>
						<Stack>
							<Link href="#" color="text.secondary">
								Twitter
							</Link>

							<Link href="#" color="text.secondary">
								Facebook
							</Link>

							<Link href="#" color="text.secondary">
								Instagram
							</Link>
						</Stack>
					</Grid>
				</Grid>
			</Container>
		</Paper>
	);
}
