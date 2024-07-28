function run {
    #echo without newline
    echo "Running: $2"

    $1 > /dev/null 2>&1
    local status=$?
    if [ $status -ne 0 ]; then
        $1

        echo -e "\033[0;31mError: $2 failed\033[0m"
        exit 1
    fi

    # write OK in green, in the same line as the command
    echo -e "\033[0;32mOK\033[0m"
}

run "yarn build" "build"
#run "yarn spell" "spell"
run "yarn lint" "lint"
#run "yarn db:lint" "db:lint"