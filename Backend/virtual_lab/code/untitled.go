// Write your Go code here
package main

import "fmt"

func sum(nums ...int) int {
    total := 0
    for _, n := range nums {
        total += n
    }
    return total
}

func main() {
    fmt.Println("Sum of 1, 2, 3:", sum(1, 2, 3))
    fmt.Println("Sum of 4, 5:", sum(4, 5))
    fmt.Println("Sum of no numbers:", sum())
}