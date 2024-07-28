export const getTypeVMKeysFromDescription = (description: string) => {
	const descriptionLines = description.split("\n");

	// get all items starting with TYPEVPS_*=*
	const items = descriptionLines.filter((line) =>
		line.startsWith("* TYPEVPS_"),
	);
	const typevpsValues: { [key: string]: string } = {};
	for (const item of items) {
		const split = item.split("=");
		const key = split[0].replace("* TYPEVPS_", "");
		const value = split[1];

		typevpsValues[key] = value;
	}

	return typevpsValues;
};
