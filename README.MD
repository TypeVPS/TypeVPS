# Project abandoned
This project is no longer maintained. I have no plans to continue working on it.
Only use this code for educational purposes.

# Old readme

## Prerequisites
Before getting started, please ensure that you have the following applications installed on your system:
* Visual Studio Code (or any other editor supporting [.devcontainers](https://containers.dev/)
* Docker

## Using devcontainers
Our development environment runs inside a Docker container using the .devcontainer configuration files. To get started with the development environment:

1. Clone the repository.
2. Open the project in Visual Studio Code.
3. Fill out the variables inside the `./.devcontainer/.sample.env` file into `./.devcontainer/.env`
3. When prompted, install the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension for Visual Studio Code.
4. When prompted, select "Reopen in Container" to start the development environment.

## Manual setup (without devcontainers, not recommended)
If you prefer not to use the devcontainer configuration, you can manually set up the development environment by following the steps below:
1. Install the following applications:
	* [Docker](https://docs.docker.com/get-docker/)
	* [Node.js](https://nodejs.org/en/download/)
	* [Yarn](https://classic.yarnpkg.com/en/docs/install)

2. Setup the environment variables:
	* Fill out variables inside the `./.devcontainer/.sample.env` file
	* Run `source ./.devcontainer/.sample.env` to export the variables

3. Install the dependencies:
	* Run `yarn install` in the root directory of the project
	* Migrate and build the database by running `yarn db:migrate && yarn db:generate && yarn db:seed` in the root directory of the project

4. Start the development server:
	* Run `yarn dev` in the root directory of the project

## Note on ownership
All code is created and owned by [Marius Kieler](https://kieler.dev). Contact me directly if you want to license the code for commercial use.
The code was running [TypeVPS](https://typevps.com) with permission from Marius Kieler.